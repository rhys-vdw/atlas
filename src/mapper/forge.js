import { isArray, isObject } from 'lodash';
import { assignResolved, defaultsResolved } from '../arguments';

export default {

  /**
   * @method Mapper#forge
   * @summary
   *
   * Create a record.
   *
   * @description
   *
   * Create a new record object. This doesn't persist any data, it just creates an
   * instance to be manipulated with JavaScript.
   *
   * ```
   * const Messages = Mapper.tables('messages').defaultAttributes({
   *   created_at: () => new Date(),
   *   urgency: 'low'
   * });
   *
   * const greeting = Messages.forge({ message: `Hi there` });
   * // { message: 'How's it goin?', created_at: '2015-11-28', urgency: 'low' }
   * ```
   *
   * By default this is an instance of `Object`, but it is possible to change
   * the type of the records that Atlas accepts and returns. Override the
   * `createRecord`, `getAttributes`, `setAttributes`, `getRelated` and
   * `setRelated` methods.
   *
   * @param {Object} attributes
   */
  forge(attributes = {}) {

    if (isArray(attributes)) {
      return attributes.map(this._forgeOne, this);
    }

    return this._forgeOne(attributes);
  },

  /** @private */
  _forgeOne(attributes) {

    if (attributes == null) {
      attributes = {};
    } else if (!isObject(attributes)) throw new TypeError(
      `expected 'attributes' to be an object, got: ${attributes}`
    );

    const { defaultAttributes, strictAttributes } = this.state;

    const defaulted = defaultsResolved.call(
      this, attributes, defaultAttributes, attributes
    );
    const overridden = assignResolved.call(
      this, defaulted, strictAttributes, defaulted
    );

    return this.createRecord(overridden);
  }
};
