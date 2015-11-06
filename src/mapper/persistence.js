import _ from 'lodash';
import { isArray, isEmpty, isObject } from 'lodash/lang';
import { groupBy, map, size } from 'lodash/collection';
import { flatten, first, zipWith } from 'lodash/array';
import { mapValues } from 'lodash/object';
import Promise from 'bluebird';

import { NotFoundError, UnidentifiableRecordError } from '../errors';
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

  /**
   * @method insert
   * @belongsTo Mapper
   * @summary
   *
   * Insert one or more records.
   *
   * @description
   *
   * Insert a record or an array of records into the `table` assigned to this
   * `Mapper`. Returns a promise resolving the the record object (or objects)
   * with updated attributes.
   *
   * Using PostgreSQL every record will be updated to the attributes present in
   * the table after insert. Any other DBMS will only return the primary key
   * of the first record, which is then assigned to the {@link
   * Mapper#idAttribute idAttribute}.
   *
   * @todo
   *
   * Do something better for non-PostgreSQL databases. It could do each insert
   * as an individual query (allowing update of the `idAttribute`). Or fetch the
   * rows (`SELECT *`) in range after the insert. For instance, if ten records
   * were inserted, and the first ID is 5, then select rows 5-15 and return them
   * as the response. Need to investigate whether this is safe to do in a
   * transaction (and does not cause performance problems).
   *
   * @param {...Object|Object[]} records
   *   One or more records to be inserted.
   * @returns {Promise<Object|Object[]>}
   *   Promise resolving to the record(s) with updated attributes.
   */
  insert(...records) {

    const toInsert = normalizeRecords(...records);

    // Short circuit if no truthy values are supplied.
    if (isEmpty(toInsert)) {
      return Promise.resolve(toInsert);
    }

    // Pass records to `QueryBuilder`.
    return this.prepareInsert(toInsert).toQueryBuilder()
    .then(response => isArray(toInsert)
      ? this.handleInsertManyResponse(response, toInsert)
      : this.handleInsertOneResponse(response, toInsert)
    );
  },

  /**
   * @method toInsertQueryBuilder
   * @belongsTo Mapper
   * @summary
   *
   * Generate an insert query.
   *
   * @description
   *
   * Generates a Knex `QueryBuilder` object that inserts given `records` into
   * the table assigned to this `Mapper`.
   *
   * @param {...Object|Object[]} records
   *   Record, or records, to insert into this `Mapper`'s table.
   * @returns {QueryBuilder}
   *   A Knex `QueryBuilder` that, when executed, will insert supplied
   *   `records`.
   */
  prepareInsert(...records) {

    // `QueryBuilder#insert` accepts a single row or an array of rows.
    //
    // Apply any necessary processing to the records. If these methods haven't
    // been overridden they just default to `_.identity`, and this is a noop.
    //
    const rows = _(records)
      .flatten()
      .compact()
      .map(this.getAttributes, this)
      .map(this.attributesToColumns, this)
      .value();

    // Insert record(s) and return all modified rows. DBMSes other than
    // PostgreSQL will not receive the `RETURNING` command and return
    // the ID of the first inserted model.
    //
    return this.query('insert', rows, '*');
  },

  /**
   * @method handleInsertOneResponse
   * @belongsTo Mapper
   * @private
   * @summary
   *
   * Update a record after an {@link Mapper#insert insert} operation.
   *
   * @param {Number[]|Number|Object} response
   *   Entire response array, or one element from a response.
   * @param {Object} record
   *   Record that was inserted.
   * @returns {Object}
   *   Record updated according to response.
   */
  handleInsertOneResponse(response, record) {

    // We handle inserting `null` records here.
    if (record == null) {
      return null;
    }

    // Handle either an entire response array (if just one model has been
    // inserted). Or handle just a single element from the response array.
    //
    const returned = isArray(response)
      ? first(response)
      : response;

    // If this is empty, just return the model unmodified. This is the case,
    // with a DBMS other than PostgreSQL, in the case for all records after the
    // first in a bulk insert.
    //
    if (returned == null) {
      return record;
    }

    // An object here means we've got a PostgreSQL response, which will be all
    // of the columns in the updated row.
    //
    if (isObject(returned)) {
      const attributes = this.columnsToAttributes(response);
      return this.setAttributes(record, attributes);
    }

    // We can't update a composite key. As I understand, any DBMS other than
    // PostgreSQL can only return auto-incremented keys (and only one of them),
    // so this shouldn't be a problem.
    //
    const idAttribute = this.getOption('idAttribute');
    if (!isArray(idAttribute)) {
      return this.setAttribute(record, idAttribute, returned);
    }
  },

  /**
   * @method handleInsertManyResponse
   * @belongsTo Mapper
   * @private
   * @summary
   *
   * Update records after a bulk {@link Mapper#insert insert} operation.
   *
   * @param {mixed[]} response
   *   An array of returned primary key values, or of Objects holding
   *   column/value pairs.
   * @param {Object[]} records
   *   Records to be updated. The number of records updated is limited to
   *   length of the `reponse` argument.
   * @returns {Object[]}
   *   Records updated with response data.
   */
  handleInsertManyResponse(response, records) {
    return zipWith(response, records, this.handleInsertOneResponse, this);
  },

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
