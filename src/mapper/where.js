import { isArray, isObject, isString, map } from 'lodash';
import { isMapper } from './index';
import { isQueryBuilderSpecifyingColumns } from './helpers/knex';

export default {

  /**
   * Passthrough to [`QueryBuilder#where`](http://knexjs.org/#Builder-where)
   * that respects {@link Mapper#attributeToColumn} if overridden.
   *
   * ```
   * Mapper.where(attribute:string, value:mixed) -> Mapper
   * Mapper.where(attribute:string, operator:string, value:mixed) -> Mapper
   * Mapper.where(attributes:string[], values:mixed[]) -> Mapper
   * Mapper.where({ attribute: value }) -> Mapper
   * Mapper.where(callback:function) -> Mapper
   * ```
   *
   * @method Mapper#where
   * @returns {Mapper}
   */
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

  /** @private */
  whereInMapper(attribute, Other) {
    if (!isQueryBuilderSpecifyingColumns(Other)) {
      Other = Other.attributes(attribute);
    }
    const inner = Other.prepareFetch().toQueryBuilder();
    return this._whereIn(attribute, inner);
  },

  /**
   * Passthrough to [`QueryBuilder#whereIn`](http://knexjs.org/#Builder-whereIn)
   * that respects {@link Mapper#attributeToColumn} if overridden.
   *
   * @method Mapper#whereIn
   * @returns {Mapper}
   */
  whereIn(attribute, values) {
    return isMapper(values)
      ? this.whereInMapper(...arguments)
      : this._whereIn(...arguments);
  },

  /** @private */
  _whereIn(attribute, values) {

    const columns = isArray(attribute)
      ? map(attribute, attr => this.attributeToTableColumn(attr))
      : this.attributeToTableColumn(attribute);

    return this.query('whereIn', columns, values);
  }
};
