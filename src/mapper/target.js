import { isArray, head, zipObject, reject } from 'lodash';
import { isComposite as isCompositeKey } from '../arguments';

export default {

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
    const idAttribute = this.requireState('idAttribute');
    return this.targetBy(idAttribute, ...ids);
  },

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
        } else if (isComposite) {
          mapper.where(zipObject(attribute, normalized));
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
