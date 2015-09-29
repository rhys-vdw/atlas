import { isArray, isEmpty, isString } from 'lodash/lang';
import { map } from 'lodash/collection';

const methods = {
  where(attribute, ...args) {

    let column = null;
    if (isString(attribute)) {
      // (string, mixed)
      column = this.attributeToColumn(attribute);
    } else if (isArray(attribute)) {
      // (string[], mixed[])
      column = map(attribute, this.attributeToColumn, this)
    } else if (isObject(attribute)) {
      // ({ [string]: mixed })
      column = this.attributesToColumns(attribute);
    } else {
      // (function)
      column = attribute;
    }

    return this.query('where', column, ...args);
  },

  whereIn(attribute, values) {

    const columns = isArray(attribute)
      ? map(attribute, this.attributeToColumn, this)
      : this.attributeToColumn(attribute);

    return this.query('whereIn', columns, values);
  }
}

export default { methods };
