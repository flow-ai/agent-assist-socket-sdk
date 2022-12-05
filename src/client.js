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
   * @param {string} opts.environment - required, qa or prod
   * @param {string?} opts.session - optional, session that was given on previous connect for current chat
   * @param {boolean?} opts.silent - optional, can be specified to prevent sdk from spamming to console
   */
  constructor(opts) {
    super()

    this.on(Client.INIT_CLIENT, this.start)
    this.on(Client.RECONNECT_CLIENT, this.reconnect)
    this.on(Client.CLOSE_CLIENT, this.stop)
    this.on(Client.ASSIST_DECISION, this.send('message.send'))
    this.on(Client.WIDGET_SYNC, this.send('sync'))
    this.on(Client.GET_LIST, this.send('list'))

    if (!opts.authorId || typeof opts.authorId !== 'string') {
      throw new Error('authorId should be of type string')
    }

    if (!opts.caseId || typeof opts.caseId !== 'string') {
      throw new Error('caseId should be of type string')
    }

    if (opts.environment && typeof opts.environment !== 'string') {
      throw new Error('environment should be of type string if provided')
    }

    if (opts.session && typeof opts.session !== 'string') {
      throw new Error('session should be of type string if provided')
    }

    this._authorId = opts.authorId
    this._caseId = opts.caseId
    this._endpoint = this._decideEndpoint(opts.environment)
    this._silent = !!opts.silent
    this._session = opts.session

    this._rest = new Rest(this._endpoint, this._silent)
    
    debug('Initialized client %j', this)      

    this._init()
  }

  /**
   * 
   * @param {string} env 
   */
  _decideEndpoint(env) {
    switch (env) {
      case 'qa':
        return 'https://flow.dev.aws.lcloud.com/agent-assist-gateway-web'
      case 'stage':
        return 'https://app-stg.flow.ai/agent-assist-gateway-web'
      default:
        return 'https://app.flow.ai/agent-assist-gateway-web'
    }
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

  get authorId() {
    return this._authorId
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

  setParams({ authorId, caseId, environment }) {
    this._authorId = authorId
    this._caseId = caseId
    this._endpoint = this._decideEndpoint(environment)
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

  send = (type) => (message) => {
    debug('Sending message %j', message)

    if (type === 'message.send') {
      this._startRequestTimeout(payload)
    }

    if (!this.isConnected) {
     this.emit(Client.ERROR, new Exception('Could not send the message. The socket connection is disconnected.', 'connection'))
     return
    }

    if (!message.meta || !message.meta.namespace) {
      this.emit(Client.ERROR, new Exception('Meta or namespace is not provided for the message', 'message'))
      return
    }

    const payload = {
      ...message,
      ...this._buildCommonData()
    }

    this._socket.send(JSON.stringify({
      type,
      payload
    }))
  }

  _startRequestTimeout(payload) {
    this._requestTimeout = setTimeout(() => {
      this.emit(Client.ASSIST_REPLY, { ...payload, payload: {} })
    }, Client.REQUEST_TIMEOUT)
  }

  _clearRequestTimeout() {
    clearTimeout(this._requestTimeout)
  }

  _buildCommonData() {
    return {
      authorId: this._authorId
    }
  }

  async _openConnection() {
    if (this.isConnected) {
      this.stop()
    }
    this._autoReconnect = true

    let resp
    try {
      resp = await this._rest.get({
        path: '/socket.info',
        queryParams: {
          authorId: this._authorId
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

    const { endpoint, session } = payload

    this._session = session

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(`agent-assist-${this._authorId}`, this._session)
    }

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

      if (this._session !== session) {
        return
      }

      this._socket = null

      if (evt.code === 1000) {
        return
      } else if (evt.code === 1006) {
        this.emit(Client.ERROR, new Exception('The connection closed abnormally', 'connection', null, true))
        this.emit(Client.CLOSE, Client.GENERAL_NAMESPACE_META)

        this._reconnect()
      } else if (evt && evt.reason !== 'connection failed') {
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
        error,
        type
      } = JSON.parse(evt.data)

      debug('Received websocket message %j', {event, payload, meta, error})

      // if 'event' is undefined use 'type' from evt.data
      switch (event || type) {
        case 'pong':
          break
        case Client.BOT_REPLY:
          debug('Received bot reply %j', payload)
          this._clearRequestTimeout()
          this.emit(Client.ASSIST_REPLY, {event, payload, meta, error})
          break
        case Client.SYNC_BROADCAST:
          debug('Received sync action %j', payload)
          this.emit(Client.WIDGET_SYNC_SUB, { payload, meta, error })
          break
        case Client.SESSION_INFO:
          debug('Received session action %j', payload)
          this.emit(Client.SESSION, { payload, meta, error })
          break
        case Client.LIST_REPLY:
          debug('Received list action %j', payload)
          this.emit(Client.GET_LIST_REPLY, { payload, meta, error })
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
        if (this.isConnected) {
          debug('Sending keep alive packet')
          this._socket.send(JSON.stringify({
            type: 'ping'
          }))
        }
      } catch(err) {
        error('Failed sending ping %s', err.stack)
        if (!this._silent) {
          console.error('Error while sending a keepalive ping', err)
        }
      }
    }, Client.PING_INTERVAL)
  }

  _reconnect() {
    if (!this._autoReconnect) {
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

    if (this._reconnectTimeout) {
      // Whenever we close the connection manually,
      // we kill any idle reconnect time outs
      clearTimeout(this._reconnectTimeout)
    }

    if (this._keepAliveInterval) {
      // Stop any keep alive intervals
      clearInterval(this._keepAliveInterval)
    }

    if (this.isConnected) {
      debug('Closing the socket')
      this._socket.close(1000)
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

Client.WIDGET_SYNC = 'WIDGET_SYNC'

Client.WIDGET_SYNC_SUB = 'WIDGET_SYNC_SUBSCRIPTION'

Client.SYNC_BROADCAST = 'sync.broadcast'

Client.SESSION_INFO = 'session.info'

Client.SESSION = 'session'

Client.GET_LIST = 'get.list'

Client.LIST_REPLY = 'list.reply'

Client.GET_LIST_REPLY = 'get.list.reply'

Client.TRIGGER_WORKFLOWS_OPENING = 'TRIGGER_WORKFLOWS_OPENING'

Client.MAX_RECONNECT_TIMEOUT = 20000

Client.REQUEST_TIMEOUT = 10000

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