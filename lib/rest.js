"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _debugjsWrapper = _interopRequireDefault(require("debugjs-wrapper"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _debugWrapper$all = _debugjsWrapper["default"].all('flowai:agent-assist:rest'),
    debug = _debugWrapper$all.debug,
    error = _debugWrapper$all.error;

var Rest = /*#__PURE__*/function () {
  function Rest(endpoint, silent) {
    _classCallCheck(this, Rest);

    debug('Creatig a new REST instance %j', {
      endpoint: endpoint,
      silent: silent
    });
    this._endpoint = endpoint;
    this._silent = silent;
  }
  /**
   * 
   * @param {object} options 
   * @param {string} options.path
   * @param {string?} options.token
   * @param {object?} options.headers
   * @param {object?} options.queryParams
   */


  _createClass(Rest, [{
    key: "get",
    value: function get(options) {
      return this._call(options.path, {
        headers: options.headers,
        token: options.token
      }, options.queryParams);
    }
    /**
     * 
     * @param {string} path 
     * @param {object} enveloppe 
     * @param {object?} enveloppe.headers
     * @param {string?} enveloppe.method
     * @param {string?} enveloppe.body
     * @param {string?} enveloppe.token
     * @param {object?} queryParams 
     */

  }, {
    key: "_call",
    value: function () {
      var _call2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(path, enveloppe, queryParams) {
        var url, headers, resp;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                url = "".concat(this._endpoint).concat(path);
                debug('Calling URL %s %j', url, {
                  headers: enveloppe.headers,
                  queryParams: queryParams
                });
                headers = this._createHeaders(enveloppe);
                _context.prev = 3;
                _context.next = 6;
                return _axios["default"].request({
                  url: url,
                  params: queryParams,
                  headers: headers,
                  method: enveloppe.method,
                  data: enveloppe.body
                });

              case 6:
                resp = _context.sent;
                return _context.abrupt("return", resp.data);

              case 10:
                _context.prev = 10;
                _context.t0 = _context["catch"](3);
                error('Failed requesting %s', _context.t0.stack);
                throw _context.t0;

              case 14:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[3, 10]]);
      }));

      function _call(_x, _x2, _x3) {
        return _call2.apply(this, arguments);
      }

      return _call;
    }()
    /**
     * 
     * @param {object} enveloppe 
     * @param {object?} enveloppe.headers
     * @param {string?} enveloppe.token
     */

  }, {
    key: "_createHeaders",
    value: function _createHeaders(enveloppe) {
      var headers = {
        'Content-Type': 'application/json'
      };

      if (enveloppe.headers) {
        headers = _objectSpread(_objectSpread({}, headers), enveloppe.headers);
      }

      if (enveloppe.token) {
        headers = _objectSpread(_objectSpread({}, headers), {}, {
          'Authorization': "Bearer ".concat(enveloppe.token)
        });
      }

      return headers;
    }
  }]);

  return Rest;
}();

var _default = Rest;
exports["default"] = _default;