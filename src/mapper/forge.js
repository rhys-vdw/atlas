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

    const defaulted = defaultsResolved.call(
      this, attributes, defaultAttributes, attributes
    );
    const overridden = assignResolved.call(
      this, defaulted, strictAttributes, defaulted
    );

    return this.createRecord(overridden);
  }
};
