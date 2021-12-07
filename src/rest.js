import axios from 'axios'
import debugWrapper from 'debugjs-wrapper'

const { debug, error } = debugWrapper.all('flowai:agent-assist:rest')

class Rest {
  constructor(endpoint, silent) {
    debug('Creatig a new REST instance %j', {endpoint, silent})

    this._endpoint = endpoint
    this._silent = silent
  }

  /**
   * 
   * @param {object} options 
   * @param {string} options.path
   * @param {string?} options.token
   * @param {object?} options.headers
   * @param {object?} options.queryParams
   */
  get(options) {
    return this._call(options.path, {headers: options.headers, token: options.token}, options.queryParams)
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
  async _call(path, enveloppe, queryParams) {
    const url = `${this._endpoint}${path}`

    debug('Calling URL %s %j', url, {headers: enveloppe.headers, queryParams})

    const headers = this._createHeaders(enveloppe)

    try {
      const resp = await axios.request({
        url,
        params: queryParams,
        headers,
        method: enveloppe.method,
        data: enveloppe.body
      })

      return resp.data
    } catch (err) {
      error('Failed requesting %s', err.stack)
      throw err
    }
  }

  /**
   * 
   * @param {object} enveloppe 
   * @param {object?} enveloppe.headers
   * @param {string?} enveloppe.token
   */
  _createHeaders(enveloppe) {
    let headers = {
      'Content-Type': 'application/json'
    }

    if (enveloppe.headers) {
      headers = {
        ...headers,
        ...enveloppe.headers
      }
    }

    if (enveloppe.token) {
      headers = {
        ...headers,
        'Authorization': `Bearer ${enveloppe.token}`
      }
    }

    return headers
  }
}

export default Rest