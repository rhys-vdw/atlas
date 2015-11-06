import { isArray, isEmpty } from 'lodash/lang';
import { map, size } from 'lodash/collection';
import { first } from 'lodash/array';
import Promise from 'bluebird';

import { NotFoundError, UnidentifiableRecordError } from '../errors';
import { normalizeRecords } from '../arguments';

const methods = {

  /**
   * @method update
   * @belongsTo Mapper
   * @summary
   *
   * Update rows corresponding to one or more records.
   *
   * @param {Object|Object[]}
   *   Record, or records, to be updated.
   * @returns {Promise<Object|Object[]>}
   *   A promise resolving to the updated record or records.
   */
  update(...records) {

    const toUpdate = normalizeRecords(...records);

    if (isEmpty(toUpdate)) {
      return Promise.resolve(toUpdate);
    }

    if (!isArray(toUpdate)) {
      return this.updateRow(toUpdate);
    }

    return Promise.all(map(records, this.updateRow, this));
  },

  /**
   * @method updateRow
   * @belongsTo Mapper
   * @summary
   *
   * Update the row corresponding to a record.
   *
   * @description
   *
   * Updates all columns on the database row matching the {@link
   * Mapper#idAttribute idAttribute} of given record.
   *
   * @todo
   *   Consider providing an option to not throw when an update fails.
   * @todo
   *   Take advantage of PostgreSQL's `RETURNING` syntax and update
   *   all rows on the model after update. This would be useful in the
   *   case of updating with a partial record.
   *
   * @throws {Errors.NotFoundError}
   *   If no row is updated.
   * @param {Object} record
   *   Record to be updated.
   * @returns {Promise<Object>}
   *   A promise resolving to the updated record.
   */
  updateRow(record) {

    // Short circuit if no argument is provided.
    if (record == null) {
      return null;
    }

    const queryBuilder = this.prepareUpdate(record).toQueryBuilder();
    queryBuilder.then(response =>
      this.handleUpdateRowResponse({ queryBuilder, response, record })
    );
  },

  handleUpdateRowResponse({ queryBuilder, response, record }) {

    // Handle either rows or changed count.
    const count = isArray(response) ? response.length : response;

    // If no row was updated, the record was not present in the database. For
    // now always throw here, forcing consumer code to catch.
    //
    if (count === 0) throw new NotFoundError(
      this, queryBuilder, 'update'
    );

    // Update columns. This will just return the record if there are no columns.
    return this.setColumns(record, first(response));
  },

  getUpdateAttributes(record) {
    const idAttribute = this.getOption('idAttribute');
    return this.omitAttributes(record, idAttribute);
  },

  getUpdateColumns(record) {
    return this.attributesToColumns(this.getUpdateAttributes(record));
  },

  prepareUpdate(record) {

    // Get ID attributes as an array.
    //
    const idAttribute = this.getOption('idAttribute');
    const attributeNames = isArray(idAttribute)
      ? idAttribute.toArray()
      : [idAttribute];

    // Get ID attribute/value pairs for this record.
    //
    const attributes = this.pickAttributes(record, attributeNames);

    // If fewer attributes were picked than ID attributes on the Mapper, then
    // it cannot reliably be updated.
    //
    if (size(attributes) !== attributeNames.length) {
      throw new UnidentifiableRecordError(this, record, attributeNames);
    }

    // Process attributes for insertion. This is a no-op unless these methods
    // have been overridden.
    //
    const updateColumns = this.getUpdateColumns(record);
    const whereColumns = this.attributesToColumns(attributes);

    // Update the specific row, appending a `RETURNS` clause if PostgreSQL.
    //
    return this.query(queryBuilder => queryBuilder
      .where(whereColumns)
      .update(updateColumns, '*')
    );
  },
};

export default { methods };
