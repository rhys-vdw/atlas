import { isArray, isObject, isString, map } from 'lodash';
import { isMapper } from './index';
import { isQueryBuilderSpecifyingColumns } from './helpers/knex';

export default {

  where(attribute, ...args) {

    let column = null;
    if (isString(attribute)) {
      // (string, mixed)
      column = this.attributeToTableColumn(attribute);
    } else if (isArray(attribute)) {
      // (string[], mixed[])
      column = map(attribute, attr => this.attributeToTableColumn(attr));
    } else if (isObject(attribute)) {
      // ({ [string]: mixed })
      column = this.attributesToTableColumns(attribute);
    } else {
      // (function)
      column = attribute;
    }

    return this.query('where', column, ...args);
  },

  whereInMapper(attribute, Other) {
    if (!isQueryBuilderSpecifyingColumns(Other)) {
      Other = Other.attributes(attribute);
    }
    const inner = Other.prepareFetch().toQueryBuilder();
    return this._whereIn(attribute, inner);
  },

  whereIn(attribute, values) {
    return isMapper(values)
      ? this.whereInMapper(...arguments)
      : this._whereIn(...arguments);
  },

  _whereIn(attribute, values) {

    const columns = isArray(attribute)
      ? map(attribute, attr => this.attributeToTableColumn(attr))
      : this.attributeToTableColumn(attribute);

    return this.query('whereIn', columns, values);
  }
};
