import _ from 'lodash';
import { isArray, isObject, isUndefined } from 'lodash/lang';
import { identity } from 'lodash/utility';
import { defaults, assign } from 'lodash/object';
import { reduce } from 'lodash/collection';

const defaultOptions = {
  defaultAttributes: null
}

const methods = {

  // -- Parse/format hooks --

  columnToAttribute: identity,

  attributeToColumn: identity,

  columnsToAttributes: identity,

  attributesToColumns: identity,

  // -- Model adapter --

  getAttributes: identity,

  getAttribute(record, attribute) {
    return record[attribute];
  },

  pickAttributes(record, attributes) {
    if (!isArray(attributes)) {
      attributes = [attributes];
    }

    return reduce(attributes, (result, attribute) => {
      const value = this.getAttribute(record, attribute);
      if (!isUndefined(value)) {
        result[attribute] = value;
      }
      return result;
    }, {});
  },

  setAttribute(record, attribute, value) {
    record[attribute] = value;
    return record;
  },

  setAttributes(record, attributes) {
    return reduce(attributes, (accumulator, value, attribute) =>
      this.setAttribute(accumulator, attribute, value)
    , record);
  },

  createRecord(attributes = {}) {
    return attributes;
  },

  destroyRecord(record) {
    return null;
  },

  // TODO: Move `forge` and `defaultAttributes` methods to `mapper-creation.js`.

  // Private helper.

  _forgeOne(attributes) {
    const defaultAttributes = this.getOption('defaultAttributes');
    if (defaultAttributes != null) {
      defaults(attributes, defaultAttributes.toObject());
    }
    return this.createRecord(attributes);
  },

  // Public interface.

  forge(attributes = {}) {

    if (isArray(attributes)) {
      return attributes.map(this._forgeOne, this);
    }

    if (isObject(attributes)) {
      return this._forgeOne(attributes);
    }

    throw new TypeError('`attributes` must be instance of Object or Array');
  }


};

export default { defaultOptions, methods };
