import { isArray, isEmpty, isString, isUndefined } from 'lodash/lang';
import { each, head } from 'lodash/collection';

const options = {
  isSingle: false
}

const methods = {

  /**
   * @method one
   * @belongsTo Mapper
   * @summary
   *
   * Query a single row.
   *
   * @param {mixed} [id]
   *   ID value unique to target row, or record with ID value. Supply
   *   an array for compoud keys. Omit to simply limit the result of any
   *   queries to one row.
   * @returns {Mapper}
   *   Mapper targeting a single row.
   */
  one(id) {
    const normalized = this.identify(id);
    return isUndefined(normalized)
      ? this.setOption('isSingle', true)
      : this.oneId(normalized);
  },

  /**
   * @method all
   * @belongsTo Mapper
   * @summary
   *
   * Query multiple rows.
   *
   * @param {...mixed|mixed[]} ids
   *   ID values, or records with ID values, for target rows. If omitted this
   *   unlimits any subsequent query.
   * @returns {Mapper}
   *   Mapper targeting a single row.
   */
  all(...ids) {
    const normalized = this.identify(...ids);
    return isEmpty(normalized)
      ? this.setOption('isSingle', false)
      : this.allIds(normalized);
  },

  /** @private */
  oneId(id) {
    return this.withMutations(mapper => {
      const idAttribute = this.getOption('idAttribute');
      mapper
        .setOption('isSingle', true)
        .where(idAttribute, id);
    });
  },

  /** @private */
  allIds(ids) {
    return this.withMutations(mapper => {
      const idAttribute = this.getOption('idAttribute');
      mapper
        .setOption('isSingle', false)
        .whereIn(idAttribute, ids)
    });
  }
};

export default { options, methods };
