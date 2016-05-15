import {
  isArray, isEmpty, map, size, values as objectValues, omit, first
} from 'lodash';
import Promise from 'bluebird';

import { NotFoundError, UnidentifiableRecordError } from '../errors';
import {
  assignResolved, isValidId, keyCardinality, normalizeRecords
} from '../arguments';

export default {

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

    return Promise.all(map(records, record => this.updateRow(record)));
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
    const idAttribute = this.requireState('idAttribute');
    const attributes = this.getAttributes(record);
    const { strictAttributes } = this.state;
    return assignResolved(
      omit(attributes, idAttribute),
      strictAttributes,
      attributes
    );
  },

  getUpdateColumns(record) {
    return this.attributesToColumns(this.getUpdateAttributes(record));
  },

  prepareUpdate(record) {

    // Get ID attributes as an array.
    //
    const idAttribute = this.requireState('idAttribute');

    // Get ID attribute/value pairs for this record.
    //
    const whereAttributes = this.pickAttributes(record, idAttribute);

    // If fewer attributes were picked than ID attributes on the Mapper, then
    // it cannot reliably be updated.
    //
    if (
      !isValidId(objectValues(whereAttributes)) ||
      size(whereAttributes) !== keyCardinality(idAttribute)
    ) {
      throw new UnidentifiableRecordError(this, record, idAttribute);
    }

    // Process attributes for insertion. This is a no-op unless these methods
    // have been overridden.
    //
    const updateColumns = this.getUpdateColumns(record);
    const whereColumns = this.attributesToColumns(whereAttributes);

    // Update the specific row, appending a `RETURNS` clause if PostgreSQL.
    //
    return this.query(queryBuilder => queryBuilder
      .where(whereColumns)
      .update(updateColumns, '*')
    );
  },
};
