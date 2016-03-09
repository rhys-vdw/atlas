import { isArray, isObject } from 'lodash/lang';
import { assignResolved, defaultsResolved } from '../arguments';

const methods = {

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
      attributes, defaultAttributes, attributes
    );
    const overridden = assignResolved(
      defaulted, strictAttributes, defaulted
    );

    return this.createRecord(overridden);
  }
};

export default { methods };
