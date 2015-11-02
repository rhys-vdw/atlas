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
    const idAttribute = this.getOption('idAttribute');
    return this.targetBy(idAttribute, ...ids);
  },

  targetBy(attribute, ...ids) {
    const normalized = this.identifyBy(attribute, ...ids);

    if (normalized == null || isArray(normalized) && isEmpty(normalized)) {
      throw new TypeError(
        `'ids' failed to identify any rows. Got: ${ ids }`
      );
    }

    const isComposite = isArray(attribute);
    const isSingle = !isArray(normalized) ||
      isComposite && !isArray(head(normalized));

    return this.withMutations(mapper => {
      if (isSingle) {
        if (isComposite) {
          mapper.one().where(zipObject(attribute, normalized));
        } else {
          mapper.one().where(attribute, normalized);
        }
      } else {
        mapper.all().whereIn(attribute, normalized);
      }
    });
  }
};

export default { methods };
