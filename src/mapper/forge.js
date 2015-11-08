import { defaults } from 'lodash/object';
import { isArray, isObject } from 'lodash/lang';
import { zipObject } from 'lodash/array';

const options = {
  defaultAttributes: null
};

const methods = {

  defaultAttribute(attribute, value) {
    const isSingle = !isArray(attribute);
    return this.updateOption('defaultAttributes', previous =>
      isSingle
        ? { ...previous, [attribute]: value }
        : { ...previous, ...zipObject(attribute, value) }
    );
  },

  defaultAttributes(attributes) {
    return this.updateOption('defaultAttributes', previous =>
      ({ ...previous, ...attributes })
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
    defaults(attributes, defaultAttributes);
    return this.createRecord(attributes);
  }
};

export default { options, methods };
