import { isArray, isObject, isString } from 'lodash/lang';
import { map } from 'lodash/collection';

const methods = {

  where(attribute, ...args) {

    let column = null;
    if (isString(attribute)) {
      // (string, mixed)
      column = this.attributeToTableColumn(attribute);
    } else if (isArray(attribute)) {
      // (string[], mixed[])
      column = map(attribute, this.attributeToTableColumn, this);
    } else if (isObject(attribute)) {
      // ({ [string]: mixed })
      column = this.attributesToTableColumns(attribute);
    } else {
      // (function)
      column = attribute;
    }

    return this.query('where', column, ...args);
  },

  whereIn(attribute, values) {

    const columns = isArray(attribute)
      ? map(attribute, this.attributeToTableColumn, this)
      : this.attributeToTableColumn(attribute);

    return this.query('whereIn', columns, values);
  }
};

export default { methods };
