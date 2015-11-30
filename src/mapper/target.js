import { isArray, isEmpty } from 'lodash/lang';
import { head, zipObject } from 'lodash/array';
import { reject } from 'lodash/collection';
import { isComposite as isCompositeKey } from '../arguments';

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

    const isComposite = isCompositeKey(attribute);
    const isSingle = !isArray(normalized) ||
      isComposite && !isCompositeKey(head(normalized));

    return this.withMutations(mapper => {
      mapper.setOption('isSingle', isSingle);

      if (isSingle) {
        if (normalized == null) {
          mapper.noop(`'ids' failed to identify any rows. Got: ${ids}`);
        } else if (isComposite) {
          mapper.where(zipObject(attribute, normalized));
        } else {
          mapper.where(attribute, normalized);
        }
      } else {
        const compacted = reject(normalized, id => id == null);
        if (isEmpty(compacted)) {
          mapper.noop(`'ids' failed to identify any rows. Got: ${ids}`);
        } else {
          mapper.whereIn(attribute, compacted);
        }
      }

    });
  }
};

export default { methods };
