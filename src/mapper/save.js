import { isArray, isEmpty, groupBy, flatten, mapValues } from 'lodash';
import Promise from 'bluebird';

import { normalizeRecords } from '../arguments';

export default {

  /**
   * @method Mapper#save
   * @summary
   *
   * Persist records.
   *
   * @description
   *
   * Insert or update one or more records. The decision of whether to insert or
   * update is based on the result of testing each record with
   * {@link Mapper#isNew}.
   *
   * @param {...Object|Object[]} records
   *   One or more records to be saved.
   * @returns {Promise<Object|Object[]>}
   *   A promise resolving to the saved record(s) with updated attributes.
   */
  save(...records) {

    const toSave = normalizeRecords(...records);

    if (isEmpty(toSave)) {
      return Promise.resolve(toSave);
    }

    if (!isArray(toSave)) {
      return this.isNew(toSave)
        ? this.insert(toSave)
        : this.update(toSave);
    }

    // Otherwise group records according to whether they already exist in the
    // database or not.
    //
    const recordsByMethod = groupBy(toSave, record =>
      this.isNew(record) ? 'insert' : 'update'
    ).value();

    // Now pass records to `insert` or `update` accordingly.
    //
    return Promise.props(
      mapValues(recordsByMethod, (records, method) => this[method](records))
    ).bind(this).then(this.handleSaveManyResponse);
  },

  /** @private */
  handleSaveManyResponse({insert, update}) {
    return flatten([insert, update]);
  },
};
