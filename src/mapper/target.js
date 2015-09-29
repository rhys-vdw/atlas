import { isArray, isEmpty } from 'lodash/lang';
import { head, zipObject } from 'lodash/array';

const methods = {

  /**
   * @method target
   * @belongsTo Mapper
   * @summary
   *
   * Limit query to one or more specific rows.
   *
   * @param {...mixed|mixed[]} ids
   *   ID values, or records with ID values, for target rows.
   * @returns {Mapper}
   *   Mapper targeting a one or more rows.
   */
  target(...ids) {
    const normalized = this.identify(...ids);

    if (ids == null || isArray(ids) && isEmpty(ids)) {
      return this;
    }

    const idAttribute = this.getOption('idAttribute');
    const isComposite = isArray(idAttribute);
    const isSingle = !isArray(normalized) ||
      isComposite && !isArray(head(normalized));

    return this.withMutations(mapper => {
      if (isSingle) {
        if (isComposite) {
          mapper.one().where(zipObject(idAttribute, normalized))
        } else {
          mapper.one().where(idAttribute, normalized)
        }
      } else {
        mapper.all().whereIn(idAttribute, normalized)
      }
    });
  }
};

export default { methods };
