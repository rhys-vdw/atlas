import { defaults } from 'lodash/object';
import { isArray, isObject } from 'lodash/lang';

const options = {
  defaultAttributes: null
};

const methods = {

  default(defaultAttributes) {
    return this.updateOption('defaultAttributes', previous =>
      ({ ...previous, ...defaultAttributes })
    );
  },

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
    const defaultAttributes = this.getOption('defaultAttributes');
    if (defaultAttributes != null) {
      defaults(attributes, defaultAttributes.toObject());
    }
    return this.createRecord(attributes);
  }
};

export default { options, methods };
