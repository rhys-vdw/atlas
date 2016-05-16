import _, { isArray, isEmpty, isObject, first, zipWith } from 'lodash';
import Promise from 'bluebird';

import {
  assignResolved, defaultsResolved, normalizeRecords
} from '../arguments';

export default {

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

    const { defaultAttributes, strictAttributes } = this.state;

    // `QueryBuilder#insert` accepts a single row or an array of rows.
    //
    // Apply any necessary processing to the records. If these methods haven't
    // been overridden they just default to `_.identity`, and this is a noop.
    //
    const rows = _(records)
      .flatten()
      .compact()
      .map(record => this.getAttributes(record))
      .map(attributes => defaultsResolved(
        attributes, defaultAttributes, attributes, this
      ))
      .map(attributes => assignResolved(
        attributes, strictAttributes, attributes, this
      ))
      .map(attributes => this.attributesToColumns(attributes))
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
      const attributes = this.columnsToAttributes(returned);
      return this.setAttributes(record, attributes);
    }

    // We can't update a composite key. As I understand, any DBMS other than
    // PostgreSQL can only return auto-incremented keys (and only one of them).
    // Typically composite primary keys are not auto-incremented.
    //
    const idAttribute = this.requireState('idAttribute');
    if (!isArray(idAttribute)) {
      return this.setAttributes(record, { [idAttribute]: returned });
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
    return zipWith(response, records, (response, record) =>
      this.handleInsertOneResponse(response, record)
    );
  }
};
