import { isArray, isObject } from 'lodash/lang';
import { defaultsResolved } from '../arguments';

const methods = {

  forge(attributes = {}) {

    if (isArray(attributes)) {
      return attributes.map(this._forgeOne, this);
    }

    if (isObject(attributes)) {
      return this._forgeOne(attributes);
    }

    throw new TypeError('`attributes` must be instance of Object or Array');
  },

  _forgeOne(attributes) {
    const { defaultAttributes } = this.state;
    return this.createRecord(defaultsResolved(attributes, defaultAttributes));
  }
};

export default { methods };
