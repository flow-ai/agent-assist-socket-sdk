/**
 * Exception
 * @class
 * @property {string} message - Human friendly message
 * @property {string} type - Kind of error
 * @property {Exception} innerException - Inner exception
 * @property {boolean} isFinal - Prevent further execution
 **/
class Exception {

  /**
   * Constructor
   * @param {string} message - message - Human friendly message
   * @param {string} type - Kind of error
   * @param {Exception} innerException - Optional inner exception
   * @param {boolean} isFinal - Indicates if this exception prevents further execution
   **/
  constructor(message, type, innerException, isFinal = false, namespace = 'general') {

    if(!message) {
      throw new Error('Message is mandatory to create a new Exception')
    }

    if(message && message instanceof Error) {
      this.message = message.message || 'Unknown error'
    } else if(typeof message === 'string') {
      this.message = message
    } else if(message instanceof Exception) {
      return message
    } else {
      this.message = 'Unknown error'
    }

    this.innerException = innerException || null
    this.type = type || 'Generic exception'
    this.isFinal = isFinal

    this.meta = {
      namespace
    }
  }
}

export default Exception
