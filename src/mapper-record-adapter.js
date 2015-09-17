import _ from 'lodash';
import { isArray, isUndefined } from 'lodash/lang';
import { identity } from 'lodash/utility';
import { reduce } from 'lodash/collection';

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

    return reduce(attributes, (accumulator, attribute) => {
      const value = this.getAttribute(record, attribute);
      if (!isUndefined(value)) {
        accumulator[attribute] = value;
      }
      return accumulator;
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
};

export default { methods };
