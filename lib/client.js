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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
   * @param {string} opts.environment - required, qa or prod
   * @param {string?} opts.session - optional, session that was given on previous connect for current chat
   * @param {boolean?} opts.silent - optional, can be specified to prevent sdk from spamming to console
   */
  function Client(opts) {
    var _this;

    _classCallCheck(this, Client);

    _this = _super.call(this);

    _defineProperty(_assertThisInitialized(_this), "send", function (type) {
      return function (message) {
        debug('Sending message %j', message);

        if (type === 'message.send') {
          _this._startRequestTimeout(payload);
        }

        if (!_this.isConnected) {
          _this.emit(Client.ERROR, new _exception["default"]('Could not send the message. The socket connection is disconnected.', 'connection'));

          return;
        }

        if (!message.meta || !message.meta.namespace) {
          _this.emit(Client.ERROR, new _exception["default"]('Meta or namespace is not provided for the message', 'message'));

          return;
        }

        var payload = _objectSpread(_objectSpread({}, message), _this._buildCommonData());

        _this._socket.send(JSON.stringify({
          type: type,
          payload: payload
        }));
      };
    });

    _defineProperty(_assertThisInitialized(_this), "sendAnalytic", function (payload) {
      _this._analyticPull.push(payload);

      if (_this._analyticTimeout) {
        return;
      }

      _this._startAnalyticTimeout();
    });

    _defineProperty(_assertThisInitialized(_this), "_analyticSendPull", function () {
      if (!_this.isConnected) {
        _this._startAnalyticTimeout();

        return;
      }

      var pull = _this._analyticPull || [];
      _this._analyticTimeout = null;
      _this._analyticPull = [];

      _this._socket.send(JSON.stringify({
        type: 'analytic',
        payload: _objectSpread({
          payload: pull
        }, _this._buildCommonData())
      }));
    });

    _defineProperty(_assertThisInitialized(_this), "_beforeunload", function () {
      window.onbeforeunload = function () {
        var _this$_analyticPull;

        _this._analyticTimeout && clearTimeout(_this._analyticTimeout);
        ((_this$_analyticPull = _this._analyticPull) === null || _this$_analyticPull === void 0 ? void 0 : _this$_analyticPull.length) && _this._analyticSendPull();
      };
    });

    _this.on(Client.INIT_CLIENT, _this.start);

    _this.on(Client.RECONNECT_CLIENT, _this.reconnect);

    _this.on(Client.CLOSE_CLIENT, _this.stop);

    _this.on(Client.ASSIST_DECISION, _this.send('message.send'));

    _this.on(Client.WIDGET_SYNC, _this.send('sync'));

    _this.on(Client.GET_LIST, _this.send('list'));

    _this.on(Client.SEND_ANALYTIC, _this.sendAnalytic);

    if (!opts.authorId || typeof opts.authorId !== 'string') {
      throw new Error('authorId should be of type string');
    }

    if (!opts.caseId || typeof opts.caseId !== 'string') {
      throw new Error('caseId should be of type string');
    }

    if (opts.environment && typeof opts.environment !== 'string') {
      throw new Error('environment should be of type string if provided');
    }

    if (opts.session && typeof opts.session !== 'string') {
      throw new Error('session should be of type string if provided');
    }

    _this._authorId = opts.authorId;
    _this._caseId = opts.caseId;
    _this._endpoint = _this._decideEndpoint(opts.environment);
    _this._silent = !!opts.silent;
    _this._session = opts.session;
    _this._rest = new _rest["default"](_this._endpoint, _this._silent);
    _this._analyticPull = [];
    debug('Initialized client %j', _assertThisInitialized(_this));

    _this._beforeunload();

    _this._init();

    return _this;
  }
  /**
   * 
   * @param {string} env 
   */


  _createClass(Client, [{
    key: "_decideEndpoint",
    value: function _decideEndpoint(env) {
      switch (env) {
        case 'qa':
          return 'https://flow.dev.aws.lcloud.com/agent-assist-gateway-web';

        case 'stage':
          return 'https://app-stg.flow.ai/agent-assist-gateway-web';

        default:
          return 'https://app.flow.ai/agent-assist-gateway-web';
      }
    }
  }, {
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
    key: "authorId",
    get: function get() {
      return this._authorId;
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
    key: "setParams",
    value: function setParams(_ref) {
      var authorId = _ref.authorId,
          caseId = _ref.caseId,
          environment = _ref.environment;
      this._authorId = authorId;
      this._caseId = caseId;
      this._endpoint = this._decideEndpoint(environment);
    }
  }, {
    key: "start",
    value: function start() {
      var _this2 = this;

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

        this._openConnection();
      }
    }
  }, {
    key: "_startAnalyticTimeout",
    value: function _startAnalyticTimeout() {
      this._analyticTimeout = setTimeout(this._analyticSendPull, Client.ANALYTIC_TIMEOUT);
    }
  }, {
    key: "_startRequestTimeout",
    value: function _startRequestTimeout(payload) {
      var _this3 = this;

      this._requestTimeout = setTimeout(function () {
        _this3.emit(Client.ASSIST_REPLY, _objectSpread(_objectSpread({}, payload), {}, {
          payload: {}
        }));
      }, Client.REQUEST_TIMEOUT);
    }
  }, {
    key: "_clearRequestTimeout",
    value: function _clearRequestTimeout() {
      clearTimeout(this._requestTimeout);
    }
  }, {
    key: "_buildCommonData",
    value: function _buildCommonData() {
      return {
        authorId: this._authorId,
        caseId: this._caseId
      };
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
                if (this.isConnected) {
                  this.stop();
                }

                this._autoReconnect = true;
                _context.prev = 2;
                _context.next = 5;
                return this._rest.get({
                  path: '/socket.info',
                  queryParams: {
                    authorId: this._authorId
                  }
                });

              case 5:
                resp = _context.sent;
                _context.next = 14;
                break;

              case 8:
                _context.prev = 8;
                _context.t0 = _context["catch"](2);
                error('Failed requesting WS url %s', _context.t0.stack);

                if (!this._silent) {
                  console.error('AgentAssistClient: Connection error', _context.t0.stack);
                }

                this.emit(Client.ERROR, new _exception["default"](_context.t0, 'connection'));
                return _context.abrupt("return");

              case 14:
                this._handleConnection(resp.payload);

              case 15:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[2, 8]]);
      }));

      function _openConnection() {
        return _openConnection2.apply(this, arguments);
      }

      return _openConnection;
    }()
  }, {
    key: "_handleConnection",
    value: function _handleConnection(payload) {
      var _this4 = this;

      if (!payload) {
        throw new Error('Did not receive a valid response from the backend service');
      }

      var endpoint = payload.endpoint,
          session = payload.session;
      this._session = session;

      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem("agent-assist-".concat(this._authorId), this._session);
      }

      debug('Opening new WS connection for endpoint', endpoint);
      var socket = new _websocket.w3cwebsocket(endpoint);

      socket.onopen = function () {
        debug('Socket opened', endpoint);

        _this4.emit(Client.INIT, Client.GENERAL_NAMESPACE_META);

        clearInterval(_this4._keepAliveInterval);

        _this4._resetReconnectTimeout();

        _this4._keepAliveInterval = _this4._keepAlive();
      };

      socket.onerror = function (err) {
        var msg = 'Failed socket operation.';

        switch (socket.readyState) {
          case 0:
            {
              _this4.emit(Client.ERROR, new _exception["default"]("".concat(msg, " Socket is busy connecting."), 'connection'));

              break;
            }

          case 1:
            {
              _this4.emit(Client.ERROR, new _exception["default"]("".concat(msg, " Socket is connected."), 'connection'));

              break;
            }

          case 2:
            {
              _this4.emit(Client.ERROR, new _exception["default"]("".concat(msg, " Connection is busy closing."), 'connection'));

              break;
            }

          case 3:
            {
              _this4.emit(Client.ERROR, new _exception["default"]("".concat(msg, " Connection is closed."), 'connection'));

              break;
            }

          default:
            {
              _this4.emit(Client.ERROR, new _exception["default"](msg, 'connection'));

              break;
            }
        }
      };

      socket.onclose = function (evt) {
        debug('Socket closed %j', evt);

        if (_this4._session !== session) {
          return;
        }

        _this4._socket = null;

        if (evt.code === 1000) {
          return;
        } else if (evt.code === 1006) {
          _this4.emit(Client.ERROR, new _exception["default"]('The connection closed abnormally', 'connection', null, true));

          _this4.emit(Client.CLOSE, Client.GENERAL_NAMESPACE_META);

          _this4._reconnect();
        } else if (evt && evt.reason !== 'connection failed') {
          _this4.emit(Client.CLOSE, Client.GENERAL_NAMESPACE_META);

          _this4._reconnect();
        } else {
          _this4.emit(Client.CLOSE, Client.GENERAL_NAMESPACE_META);
        }
      };

      socket.onmessage = function (evt) {
        if (typeof evt.data !== 'string' || evt.data.length === 0) {
          _this4.emit(Client.ERROR, new _exception["default"]('Failed processing websocket message', 'message'));

          return;
        }

        var _JSON$parse = JSON.parse(evt.data),
            event = _JSON$parse.event,
            payload = _JSON$parse.payload,
            meta = _JSON$parse.meta,
            error = _JSON$parse.error,
            type = _JSON$parse.type;

        debug('Received websocket message %j', {
          event: event,
          payload: payload,
          meta: meta,
          error: error
        }); // if 'event' is undefined use 'type' from evt.data

        switch (event || type) {
          case 'pong':
            break;

          case Client.BOT_REPLY:
            debug('Received bot reply %j', payload);

            _this4._clearRequestTimeout();

            _this4.emit(Client.ASSIST_REPLY, {
              event: event,
              payload: payload,
              meta: meta,
              error: error
            });

            break;

          case Client.SYNC_BROADCAST:
            debug('Received sync action %j', payload);

            _this4.emit(Client.WIDGET_SYNC_SUB, {
              payload: payload,
              meta: meta,
              error: error
            });

            break;

          case Client.SESSION_INFO:
            debug('Received session action %j', payload);

            _this4.emit(Client.SESSION, {
              payload: payload,
              meta: meta,
              error: error
            });

            break;

          case Client.LIST_REPLY:
            debug('Received list action %j', payload);

            _this4.emit(Client.GET_LIST_REPLY, {
              payload: payload,
              meta: meta,
              error: error
            });

            break;

          case 'error':
            _this4.emit(Client.ERROR, new _exception["default"](payload, 'message', null, false, meta === null || meta === void 0 ? void 0 : meta.namespace));

            break;

          default:
            debug('Unknown message received %j', {
              event: event,
              payload: payload,
              meta: meta,
              error: error
            });

            _this4.emit(Client.ERROR, new _exception["default"]('Unknown message received', 'message'));

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
      var _this5 = this;

      return setInterval(function () {
        try {
          if (_this5.isConnected) {
            debug('Sending keep alive packet');

            _this5._socket.send(JSON.stringify({
              type: 'ping'
            }));
          }
        } catch (err) {
          error('Failed sending ping %s', err.stack);

          if (!_this5._silent) {
            console.error('Error while sending a keepalive ping', err);
          }
        }
      }, Client.PING_INTERVAL);
    }
  }, {
    key: "_reconnect",
    value: function _reconnect() {
      var _this6 = this;

      if (!this._autoReconnect) {
        debug('Auto reconnect is disabled');
        return;
      }

      var timeout = this.reconnectTimeout;
      debug("Reconnecting with timeout in '".concat(timeout, "'ms"));
      this._reconnectTimeout = setTimeout(function () {
        _this6.emit(Client.RECONNECT, Client.GENERAL_NAMESPACE_META);

        _this6._openConnection();
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

        this._socket.close(1000);
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
Client.WIDGET_SYNC = 'WIDGET_SYNC';
Client.WIDGET_SYNC_SUB = 'WIDGET_SYNC_SUBSCRIPTION';
Client.SYNC_BROADCAST = 'sync.broadcast';
Client.SESSION_INFO = 'session.info';
Client.SESSION = 'session';
Client.GET_LIST = 'get.list';
Client.SEND_ANALYTIC = 'send.analytic';
Client.LIST_REPLY = 'list.reply';
Client.GET_LIST_REPLY = 'get.list.reply';
Client.TRIGGER_WORKFLOWS_OPENING = 'TRIGGER_WORKFLOWS_OPENING';
Client.MAX_RECONNECT_TIMEOUT = 20000;
Client.REQUEST_TIMEOUT = 10000;
Client.ANALYTIC_TIMEOUT = 5000;
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