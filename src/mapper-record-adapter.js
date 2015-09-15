import { isArray, isObject } from 'lodash/lang';
import { identity } from 'lodash/utility';
import { defaults, assign, pick } from 'lodash/object';
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

  getAttribute(attribute, record) {
    return record[attribute];
  },

  pickAttributes(attributes, record) {
    return pluck(record, attributes);
  },

  setAttribute(attribute, value, record) {
    record[attribute] = value;
    return record;
  },

  setAttributes(attributes, record) {
    return reduce(attributes, (recordAccumulator, value, attribute) =>
      this.setAttribute(attribute, value, recordAccumulator)
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
