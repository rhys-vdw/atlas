import { isArray, isObject } from 'lodash';
import { assignResolved, defaultsResolved } from '../arguments';

export default {

  forge(attributes = {}) {

    if (isArray(attributes)) {
      return attributes.map(this._forgeOne, this);
    }

    return this._forgeOne(attributes);
  },

  _forgeOne(attributes) {

    if (attributes == null) {
      attributes = {};
    } else if (!isObject(attributes)) throw new TypeError(
      `expected 'attributes' to be an object, got: ${attributes}`
    );

    const { defaultAttributes, strictAttributes } = this.state;

    const defaulted = defaultsResolved(
      attributes, defaultAttributes, attributes, this
    );
    const overridden = assignResolved(
      defaulted, strictAttributes, defaulted, this
    );

    return this.createRecord(overridden);
  }
};
