import { isArray, isObject } from 'lodash/lang';
import { identity } from 'lodash/utility';
import { defaults } from 'lodash/object';

const defaultOptions = {
  defaultAttributes: null
}

const methods = {

  // -- Parse/format hooks

  getAttribute(attribute, record) {
    return record[attribute];
  },

  columnToAttribute: identity,

  attributeToColumn: identity,

  columnsToAttributes: identity,

  attributeToColumns: identity,

  // -- Model adapter --

  createRecord(attributes = {}) {
    return attributes;
  },

  destroyRecord(record) {
    return null;
  },

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
