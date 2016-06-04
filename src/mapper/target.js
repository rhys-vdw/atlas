import { isArray, head, zipObject, reject } from 'lodash';
import { isComposite as isCompositeKey } from '../arguments';

export default {

  /**
   * @method Mapper#target
   * @summary
   *
   * Limit query to one or more specific rows.
   *
   * @param {...mixed|mixed[]} ids
   *   ID values for target rows, or records with ID values.
   * @returns {Mapper}
   *   Mapper targeting rows with given ID value(s).
   */
  target(...ids) {
    const idAttribute = this.requireState('idAttribute');
    return this.targetBy(idAttribute, ...ids);
  },

  /**
   * @method Mapper#targetBy
   * @summary
   *
   * Limit query to one or more rows matching a given attribute.
   *
   * @param {string|string[]} attribute
   *   Attribute(s) to identify records by.
   * @param {...mixed|mixed[]} ids
   *   Values for target rows, or records with values for given attribute(s).
   * @returns {Mapper}
   *   Mapper targeting rows matching the attribute value(s).
   */
  targetBy(attribute, ...ids) {
    const normalized = this.identifyBy(attribute, ...ids);

    const isComposite = isCompositeKey(attribute);
    const isSingle = !isArray(normalized) ||
      isComposite && !isCompositeKey(head(normalized));

    return this.withMutations(mapper => {
      mapper.setState({ isSingle });

      if (isSingle) {
        if (normalized == null) {
          mapper.noop();
        } else {
          mapper.where(attribute, normalized);
        }
      } else {
        const compacted = reject(normalized, id => id == null);
        mapper.whereIn(attribute, compacted);
      }

    });
  }
};
