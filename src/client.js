import debugWrapper from 'debugjs-wrapper'
import EventEmitter from 'events'
import {w3cwebsocket as WebSocket} from 'websocket'
import Rest from './rest'
import Exception from './exception'

const { debug, error } = debugWrapper.all('flowai:agent-assist:client')

class Client extends EventEmitter {
  /**
   * 
   * @param {object} opts 
   * @param {string} opts.authorId - required to open connection for specific conversation
   * @param {string} opts.clientId - required, defines company/project in flow
   * @param {string?} opts.session - optional, session that was given on previous connect for current chat
   * @param {string?} opts.endpoint - optional, can be specified to access dev or local
   * @param {boolean?} opts.silent - optional, can be specified to prevent sdk from spamming to console
   */
  constructor(opts) {
    super()

    this.on(Client.INIT_CLIENT, this.start)
    this.on(Client.RECONNECT_CLIENT, this.reconnect)
    this.on(Client.CLOSE_CLIENT, this.stop)
    this.on(Client.ASSIST_DECISION, this.send)
    this.on(Client.TRIGGER_WORKFLOWS_OPENING, this.sendWorkflowsOpening)

    if (!opts.authorId || typeof opts.authorId !== 'string') {
      throw new Error('authorId should be of type string')
    }

    if (!opts.clientId || typeof opts.clientId !== 'string') {
      throw new Error('clientId should be of type string')
    }

    if (opts.endpoint && typeof opts.endpoint !== 'string') {
      throw new Error('endpoint should be of type string if provided')
    }

    if (opts.session && typeof opts.session !== 'string') {
      throw new Error('session should be of type string if provided')
    }

    this._authorId = opts.authorId
    this._clientId = opts.clientId
    this._endpoint = opts.endpoint || 'https://app.flow.ai/agent-assist-gateway-web'
    this._silent = !!opts.silent
    this._session = opts.session

    this._rest = new Rest(this._endpoint, this._silent)
    
    debug('Initialized client %j', this)      

    this._init()
  }

  _init() {
    this._session = null
    this._socket = null
    this._keepAliveInterval = null
    this._reconnectTimeout = null
    this._autoReconnect = null
    this._reconnectTimeoutDuration = Client.MIN_RECONNECT_TIMEOUT
  }

  get isConnected() {
    return !!this._socket
  }

  get reconnectTimeout() {
    switch (this._reconnectTimeoutDuration) {
      case Client.MAX_RECONNECT_TIMEOUT:
        return this._reconnectTimeoutDuration
      case Client.MIN_RECONNECT_TIMEOUT:
        return this._reconnectTimeoutDuration += Client.FIRST_RECONNECT_GAP
      default:
        return this._reconnectTimeoutDuration += Client.RECONNECT_TIMEOUT_GAP
    }
  }

  start() {
    debug('Starting client %j', this)
    this._openConnection()
      .catch(err => {
       this.emit(Client.ERROR, new Exception(`Failed to start the client ${err.message}`, 'connection', err))
      })
  }

    /**
   * Stop the client
   * @desc Use this method to temp disconnect a client
   *
   * @example
   * // Close the connection
   * client.stop()
   **/
  stop() {
    try {
      debug('Stopping the client')
      this._closeConnection()
    } catch(err) {
      this.emit(Client.ERROR, new Exception('Failed to stop the client', 'connection', err))
    }
  }

    /**
   * Close the connection and completely reset the client
   *
   * @example
   * // Close the connection and reset the client
   * client.destroy()
   **/
  destroy() {
    debug('Destroying client')
    this._closeConnection()
    this._init()
  }

  reconnect(meta) {
    if (!this.isConnected) {
      debug('Received reconnect event %j', meta)
      this.emit(Client.RECONNECT, Client.GENERAL_NAMESPACE_META)
      this._openConnection()
    }
  }

  send(message) {
    debug('Sending message %j', message)

    if(!this.isConnected) {
     this.emit(Client.ERROR, new Exception('Could not send the message. The socket connection is disconnected.', 'connection'))
     return
    }

    if (!message.meta && !message.meta.namespace) {
      this.emit(Client.ERROR, new Exception('Meta or namespace is not provided for the message', 'message'))
      return
    }

    this._socket.send(JSON.stringify({
      type: 'message.send',
      payload: {
        ...message,
        ...this._buildCommonData()
      }
    }))
  }

  sendWorkflowsOpening(meta) {
    debug('Sending workflows opening %j', {meta, threadId: this._session, agentId: this._agentId})

    this._socket.send(JSON.stringify({
      type: 'message.send',
      payload: {
        type: 'trigger_flow_event',
        payload: {
          eventName: 'SYS_AGENT_WORKFLOWS_START'
        },
        ...this._buildCommonData()
      }
    }))
  }

  _buildCommonData() {
    return {
      threadId: this._session,
      agentId: this._agentId,
      channelId: this._channelId
    }
  }

  async _openConnection() {
    if (this.isConnected) {
      return
    }
    this._autoReconnect = true

    let resp
    try {
      resp = await this._rest.get({
        path: '/socket.info',
        queryParams: {
          authorId: this._authorId,
          clientId: this._clientId
        }
      })
    } catch (err) {
      error('Failed requesting WS url %s', err.stack)

      if (!this._silent) {
        console.error('AgentAssistClient: Connection error', err.stack)
      }

      this.emit(Client.ERROR, new Exception(err, 'connection'))

      return
    }

    this._handleConnection(resp.payload)
  }

  _handleConnection(payload) {
    if (!payload) {
      throw new Error('Did not receive a valid response from the backend service')
    }

    const { endpoint, threadId, agentId, channelId } = payload

    this._session = threadId

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(`agent-assist-${this._authorId}`, this._session)
    }

    this._agentId = agentId
    this._channelId = channelId

    debug('Opening new WS connection for endpoint', endpoint)

    const socket = new WebSocket(endpoint)

    socket.onopen = () => {
      debug('Socket opened', endpoint)

      this.emit(Client.INIT, Client.GENERAL_NAMESPACE_META)

      clearInterval(this._keepAliveInterval)
      this._resetReconnectTimeout()

      this._keepAliveInterval = this._keepAlive()
    }

    socket.onerror = err => {
      const msg = 'Failed socket operation.'
      switch(socket.readyState) {
        case 0: {
          this.emit(Client.ERROR, new Exception(`${msg} Socket is busy connecting.`, 'connection'))
          break
        }
        case 1: {
          this.emit(Client.ERROR, new Exception(`${msg} Socket is connected.`, 'connection'))
          break
        }
        case 2: {
          this.emit(Client.ERROR, new Exception(`${msg} Connection is busy closing.`, 'connection'))
          break
        }
        case 3: {
          this.emit(Client.ERROR, new Exception(`${msg} Connection is closed.`, 'connection'))
          break
        }
        default: {
          this.emit(Client.ERROR, new Exception(msg, 'connection'))
          break
        }
      }
    }

    socket.onclose = evt => {
      debug('Socket closed %j', evt)

      this._socket = null

      if(evt.code === 1006) {
        this.emit(Client.ERROR, new Exception('The connection closed abnormally', 'connection', null, true))
        this.emit(Client.CLOSE, Client.GENERAL_NAMESPACE_META)

        this._reconnect()
      } else if(evt && evt.reason !== 'connection failed') {
        this.emit(Client.CLOSE, Client.GENERAL_NAMESPACE_META)
        this._reconnect()
      } else {
        this.emit(Client.CLOSE, Client.GENERAL_NAMESPACE_META)
      }
    }

    socket.onmessage = evt => {
      if (typeof evt.data !== 'string' || evt.data.length === 0) {
        this.emit(Client.ERROR, new Exception('Failed processing websocket message', 'message'))
        return
      }

      const {
        event,
        payload,
        meta,
        error
      } = JSON.parse(evt.data)

      debug('Received websocket message %j', {event, payload, meta, error})

      switch (event) {
        case 'pong':
          break
        case Client.BOT_REPLY:
          debug('Received bot reply %j', payload)
          this.emit(Client.ASSIST_REPLY, {event, payload, meta, error})
          break
        case 'error':
          this.emit(Client.ERROR, new Exception(payload, 'message', null, false, meta?.namespace))
          break
        default:
          debug('Unknown message received %j', {event, payload, meta, error})
          this.emit(Client.ERROR, new Exception('Unknown message received', 'message'))
          break
      }
    }

    this._socket = socket
  }

  _resetReconnectTimeout() {
    this._reconnectTimeoutDuration = Client.MIN_RECONNECT_TIMEOUT
  }

  _keepAlive() {
    return setInterval(() => {
      try {
        if(this.isConnected) {
          debug('Sending keep alive packet')
          this._socket.send(JSON.stringify({
            type: 'ping'
          }))
        }
      } catch(err) {
        error('Failed sending ping %s', err.stack)
        if(!this._silent) {
          console.error('Error while sending a keepalive ping', err)
        }
      }
    }, Client.PING_INTERVAL)
  }

  _reconnect() {
    if(!this._autoReconnect) {
      debug('Auto reconnect is disabled')
      return
    }

    const timeout = this.reconnectTimeout
    debug(`Reconnecting with timeout in '${timeout}'ms`)

    this._reconnectTimeout = setTimeout(() => {
      this.emit(Client.RECONNECT, Client.GENERAL_NAMESPACE_META)
      this._openConnection()
    }, timeout)
  }

  /**
   * Disconnnect
   * @private
   **/
  _closeConnection() {
    this._autoReconnect = false

    this._resetReconnectTimeout()

    if(this._reconnectTimeout) {
      // Whenever we close the connection manually,
      // we kill any idle reconnect time outs
      clearTimeout(this._reconnectTimeout)
    }

    if(this._keepAliveInterval) {
      // Stop any keep alive intervals
      clearInterval(this._keepAliveInterval)
    }

    if(this.isConnected) {
      debug('Closing the socket')
      this._socket.close()
    } else {
      debug('No socket connection to close')
    }
  }
}

/**
 * @constant
 * @type {string}
 * @desc Event that triggers when an error is received from the flow.ai platform
 **/
Client.ERROR = 'ERROR'

/**
 * @constant
 * @type {string}
 * @desc Event that triggers when client is connected with platform
 **/
Client.INIT = 'INIT'

Client.INIT_CLIENT = 'INIT_CLIENT'

Client.RECONNECT_CLIENT = 'RECONNECT_CLIENT'

Client.CLOSE_CLIENT = 'CLOSE_CLIENT'

/**
 * @constant
 * @type {string}
 * @desc Event that triggers when client tries to reconnect
 **/
Client.RECONNECT = 'RECONNECT'

/**
 * @constant
 * @type {string}
 * @desc Event that triggers when the client gets disconnected
 **/
Client.CLOSE = 'CLOSE'

Client.ASSIST_REPLY = 'ASSIST_REPLY'

Client.ASSIST_DECISION = 'ASSIST_DECISION'

Client.BOT_REPLY = 'bot.reply'

Client.TRIGGER_WORKFLOWS_OPENING = 'TRIGGER_WORKFLOWS_OPENING'

Client.MAX_RECONNECT_TIMEOUT = 20000

Client.RECONNECT_TIMEOUT_GAP = 500

Client.MIN_RECONNECT_TIMEOUT = 100

Client.FIRST_RECONNECT_GAP = 400

Client.PING_INTERVAL = 1000 * 25

Client.GENERAL_NAMESPACE_META = {
  meta: {
    namespace: 'general'
  }
}

export default Client