import { isArray, isEmpty } from 'lodash/lang';
import { groupBy } from 'lodash/collection';
import { flatten } from 'lodash/array';
import { mapValues } from 'lodash/object';
import Promise from 'bluebird';

import { normalizeRecords } from '../arguments';

const methods = {

  /**
   * @method save
   * @belongsTo Mapper
   * @summary
   *
   * Insert or update one or more records.
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

  handleSaveManyResponse({insert, update}) {
    return flatten([insert, update]);
  },
};

export default { methods };
