"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _debugjsWrapper = _interopRequireDefault(require("debugjs-wrapper"));

var _events = _interopRequireDefault(require("events"));

var _websocket = require("websocket");

var _rest = _interopRequireDefault(require("./rest"));

var _exception = _interopRequireDefault(require("./exception"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var _debugWrapper$all = _debugjsWrapper["default"].all('flowai:agent-assist:client'),
    debug = _debugWrapper$all.debug,
    error = _debugWrapper$all.error;

var Client = /*#__PURE__*/function (_EventEmitter) {
  _inherits(Client, _EventEmitter);

  var _super = _createSuper(Client);

  /**
   * 
   * @param {object} opts 
   * @param {string} opts.authorId - required to open connection for specific conversation
   * @param {string} opts.clientId - required, defines company/project in flow
   * @param {string?} opts.session - optional, session that was given on previous connect for current chat
   * @param {string?} opts.endpoint - optional, can be specified to access dev or local
   * @param {boolean?} opts.silent - optional, can be specified to prevent sdk from spamming to console
   */
  function Client(opts) {
    var _this;

    _classCallCheck(this, Client);

    _this = _super.call(this);

    _this.on(Client.INIT_CLIENT, _this.start);

    _this.on(Client.RECONNECT_CLIENT, _this.reconnect);

    _this.on(Client.CLOSE_CLIENT, _this.stop);

    _this.on(Client.ASSIST_DECISION, _this.send);

    if (!opts.authorId || typeof opts.authorId !== 'string') {
      throw new Error('authorId should be of type string');
    }

    if (!opts.clientId || typeof opts.clientId !== 'string') {
      throw new Error('clientId should be of type string');
    }

    if (opts.endpoint && typeof opts.endpoint !== 'string') {
      throw new Error('endpoint should be of type string if provided');
    }

    if (opts.session && typeof opts.session !== 'string') {
      throw new Error('session should be of type string if provided');
    }

    _this._authorId = opts.authorId;
    _this._clientId = opts.clientId;
    _this._endpoint = opts.endpoint || 'https://app.flow.ai/agent-assist-gateway-web';
    _this._silent = !!opts.silent;
    _this._session = opts.session;
    _this._rest = new _rest["default"](_this._endpoint, _this._silent);
    debug('Initialized client %j', _assertThisInitialized(_this));

    _this._init();

    return _this;
  }

  _createClass(Client, [{
    key: "_init",
    value: function _init() {
      this._session = null;
      this._socket = null;
      this._keepAliveInterval = null;
      this._reconnectTimeout = null;
      this._autoReconnect = null;
      this._reconnectTimeoutDuration = Client.MIN_RECONNECT_TIMEOUT;
    }
  }, {
    key: "isConnected",
    get: function get() {
      return !!this._socket;
    }
  }, {
    key: "reconnectTimeout",
    get: function get() {
      switch (this._reconnectTimeoutDuration) {
        case Client.MAX_RECONNECT_TIMEOUT:
          return this._reconnectTimeoutDuration;

        case Client.MIN_RECONNECT_TIMEOUT:
          return this._reconnectTimeoutDuration += Client.FIRST_RECONNECT_GAP;

        default:
          return this._reconnectTimeoutDuration += Client.RECONNECT_TIMEOUT_GAP;
      }
    }
  }, {
    key: "start",
    value: function start() {
      var _this2 = this;

      console.log('starting');
      debug('Starting client %j', this);

      this._openConnection()["catch"](function (err) {
        _this2.emit(Client.ERROR, new _exception["default"]("Failed to start the client ".concat(err.message), 'connection', err));
      });
    }
    /**
    * Stop the client
    * @desc Use this method to temp disconnect a client
    *
    * @example
    * // Close the connection
    * client.stop()
    **/

  }, {
    key: "stop",
    value: function stop() {
      try {
        debug('Stopping the client');

        this._closeConnection();
      } catch (err) {
        this.emit(Client.ERROR, new _exception["default"]('Failed to stop the client', 'connection', err));
      }
    }
    /**
    * Close the connection and completely reset the client
    *
    * @example
    * // Close the connection and reset the client
    * client.destroy()
    **/

  }, {
    key: "destroy",
    value: function destroy() {
      debug('Destroying client');

      this._closeConnection();

      this._init();
    }
  }, {
    key: "reconnect",
    value: function reconnect(meta) {
      if (!this.isConnected) {
        debug('Received reconnect event %j', meta);
        this.emit(Client.RECONNECT, Client.GENERAL_NAMESPACE_META);
        console.log('reconnect emit');

        this._openConnection();
      }
    }
  }, {
    key: "send",
    value: function send(message) {
      debug('Sending message %j', message);

      if (!this.isConnected) {
        this.emit(Client.ERROR, new _exception["default"]('Could not send the message. The socket connection is disconnected.', 'user'));
        return;
      }

      this._socket.send(JSON.stringify({
        type: 'message.send',
        payload: _objectSpread(_objectSpread({}, message), {}, {
          threadId: this._session,
          agentId: this._agentId,
          channelId: this._channelId
        })
      }));
    }
  }, {
    key: "_openConnection",
    value: function () {
      var _openConnection2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var resp;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this.isConnected) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return");

              case 2:
                this._autoReconnect = true;
                _context.prev = 3;
                _context.next = 6;
                return this._rest.get({
                  path: '/socket.info',
                  queryParams: {
                    authorId: this._authorId,
                    clientId: this._clientId
                  }
                });

              case 6:
                resp = _context.sent;
                _context.next = 15;
                break;

              case 9:
                _context.prev = 9;
                _context.t0 = _context["catch"](3);
                error('Failed requesting WS url %s', _context.t0.stack);

                if (!this._silent) {
                  console.error('AgentAssistClient: Connection error', _context.t0.stack);
                }

                this.emit(Client.ERROR, new _exception["default"](_context.t0, 'connection'));
                return _context.abrupt("return");

              case 15:
                this._handleConnection(resp.payload);

              case 16:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[3, 9]]);
      }));

      function _openConnection() {
        return _openConnection2.apply(this, arguments);
      }

      return _openConnection;
    }()
  }, {
    key: "_handleConnection",
    value: function _handleConnection(payload) {
      var _this3 = this;

      if (!payload) {
        throw new Error('Did not receive a valid response from the backend service');
      }

      var endpoint = payload.endpoint,
          threadId = payload.threadId,
          agentId = payload.agentId,
          channelId = payload.channelId;
      this._session = threadId;

      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem("agent-assist-".concat(this._authorId), this._session);
      }

      this._agentId = agentId;
      this._channelId = channelId;
      debug('Opening new WS connection for endpoint', endpoint);
      var socket = new _websocket.w3cwebsocket(endpoint);

      socket.onopen = function () {
        debug('Socket opened', endpoint);

        _this3.emit(Client.INIT, Client.GENERAL_NAMESPACE_META);

        clearInterval(_this3._keepAliveInterval);

        _this3._resetReconnectTimeout();

        _this3._keepAliveInterval = _this3._keepAlive();
      };

      socket.onerror = function (err) {
        var msg = 'Failed socket operation.';

        switch (socket.readyState) {
          case 0:
            {
              _this3.emit(Client.ERROR, new _exception["default"]("".concat(msg, " Socket is busy connecting."), 'connection'));

              break;
            }

          case 1:
            {
              _this3.emit(Client.ERROR, new _exception["default"]("".concat(msg, " Socket is connected."), 'connection'));

              break;
            }

          case 2:
            {
              _this3.emit(Client.ERROR, new _exception["default"]("".concat(msg, " Connection is busy closing."), 'connection'));

              break;
            }

          case 3:
            {
              _this3.emit(Client.ERROR, new _exception["default"]("".concat(msg, " Connection is closed."), 'connection'));

              break;
            }

          default:
            {
              _this3.emit(Client.ERROR, new _exception["default"](msg, 'connection'));

              break;
            }
        }
      };

      socket.onclose = function (evt) {
        debug('Socket closed %j', evt);
        _this3._socket = null;

        if (evt.code === 1006) {
          _this3.emit(Client.ERROR, new _exception["default"]('The connection closed abnormally', 'connection', null, true));

          _this3.emit(Client.CLOSE, Client.GENERAL_NAMESPACE_META);

          _this3._reconnect();
        } else if (evt && evt.reason !== 'connection failed') {
          _this3.emit(Client.CLOSE, Client.GENERAL_NAMESPACE_META);

          _this3._reconnect();
        } else {
          _this3.emit(Client.CLOSE, Client.GENERAL_NAMESPACE_META);
        }
      };

      socket.onmessage = function (evt) {
        if (typeof evt.data !== 'string' || evt.data.length === 0) {
          _this3.emit(Client.ERROR, new _exception["default"]('Failed processing websocket message', 'message'));

          return;
        }

        var _JSON$parse = JSON.parse(evt.data),
            event = _JSON$parse.event,
            payload = _JSON$parse.payload,
            meta = _JSON$parse.meta,
            error = _JSON$parse.error;

        debug('Received websocket message %j', {
          event: event,
          payload: payload,
          meta: meta,
          error: error
        });

        switch (event) {
          case 'pong':
            break;

          case Client.BOT_REPLY:
            debug('Received bot reply %j', payload);

            _this3.emit(Client.ASSIST_REPLY, {
              event: event,
              payload: payload,
              meta: meta,
              error: error
            });

            break;

          case 'error':
            _this3.emit(Client.ERROR, new _exception["default"](payload, 'message', null, false, meta === null || meta === void 0 ? void 0 : meta.namespace));

            break;

          default:
            debug('Unknown message received %j', {
              event: event,
              payload: payload,
              meta: meta,
              error: error
            });

            _this3.emit(Client.ERROR, new _exception["default"]('Unknown message received', 'message'));

            break;
        }
      };

      this._socket = socket;
    }
  }, {
    key: "_resetReconnectTimeout",
    value: function _resetReconnectTimeout() {
      this._reconnectTimeoutDuration = Client.MIN_RECONNECT_TIMEOUT;
    }
  }, {
    key: "_keepAlive",
    value: function _keepAlive() {
      var _this4 = this;

      return setInterval(function () {
        try {
          if (_this4.isConnected) {
            debug('Sending keep alive packet');

            _this4._socket.send(JSON.stringify({
              type: 'ping'
            }));
          }
        } catch (err) {
          error('Failed sending ping %s', err.stack);

          if (!_this4._silent) {
            console.error('Error while sending a keepalive ping', err);
          }
        }
      }, Client.PING_INTERVAL);
    }
  }, {
    key: "_reconnect",
    value: function _reconnect() {
      var _this5 = this;

      if (!this._autoReconnect) {
        debug('Auto reconnect is disabled');
        return;
      }

      console.log('reconnect');
      var timeout = this.reconnectTimeout;
      debug("Reconnecting with timeout in '".concat(timeout, "'ms"));
      this._reconnectTimeout = setTimeout(function () {
        _this5.emit(Client.RECONNECT, Client.GENERAL_NAMESPACE_META);

        _this5._openConnection();
      }, timeout);
    }
    /**
     * Disconnnect
     * @private
     **/

  }, {
    key: "_closeConnection",
    value: function _closeConnection() {
      this._autoReconnect = false;

      this._resetReconnectTimeout();

      if (this._reconnectTimeout) {
        // Whenever we close the connection manually,
        // we kill any idle reconnect time outs
        clearTimeout(this._reconnectTimeout);
      }

      if (this._keepAliveInterval) {
        // Stop any keep alive intervals
        clearInterval(this._keepAliveInterval);
      }

      if (this.isConnected) {
        debug('Closing the socket');

        this._socket.close();
      } else {
        debug('No socket connection to close');
      }
    }
  }]);

  return Client;
}(_events["default"]);
/**
 * @constant
 * @type {string}
 * @desc Event that triggers when an error is received from the flow.ai platform
 **/


Client.ERROR = 'ERROR';
/**
 * @constant
 * @type {string}
 * @desc Event that triggers when client is connected with platform
 **/

Client.INIT = 'INIT';
Client.INIT_CLIENT = 'INIT_CLIENT';
Client.RECONNECT_CLIENT = 'RECONNECT_CLIENT';
Client.CLOSE_CLIENT = 'CLOSE_CLIENT';
/**
 * @constant
 * @type {string}
 * @desc Event that triggers when client tries to reconnect
 **/

Client.RECONNECT = 'RECONNECT';
/**
 * @constant
 * @type {string}
 * @desc Event that triggers when the client gets disconnected
 **/

Client.CLOSE = 'CLOSE';
Client.ASSIST_REPLY = 'ASSIST_REPLY';
Client.ASSIST_DECISION = 'ASSIST_DECISION';
Client.BOT_REPLY = 'bot.reply';
Client.MAX_RECONNECT_TIMEOUT = 20000;
Client.RECONNECT_TIMEOUT_GAP = 500;
Client.MIN_RECONNECT_TIMEOUT = 100;
Client.FIRST_RECONNECT_GAP = 400;
Client.PING_INTERVAL = 1000 * 25;
Client.GENERAL_NAMESPACE_META = {
  meta: {
    namespace: 'general'
  }
};
var _default = Client;
exports["default"] = _default;