import _ from 'lodash';
import { isArray, isEmpty, isObject } from 'lodash/lang';
import { map, groupBy, size } from 'lodash/collection';
import { flatten, head, zipObject, zipWith } from 'lodash/array';
import { mapValues } from 'lodash/object';
import { List } from 'immutable';
import Promise from 'bluebird';

import { UnidentifiableRecordError } from './errors';

const { isList } = List;

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

    // Check if we're saving just one record...
    //
    const isSingle = records.length <= 1 && !isArray(head(records));

    // If so, we can just distribute it directly to the correct method.
    //
    if (isSingle) {
      const record = head(records);
      return this.isNew(record)
        ? this.insert(record)
        : this.update(record);
    }

    // Otherwise group records according to whether they already exist in the
    // database or not.
    //
    const grouped = _(records).flatten().compact().groupBy(record =>
      this.isNew(record) ? 'insert' : 'update'
    ).value();

    // Now pass records to `insert` or `update` accordingly.
    //
    return Promise.props(
      mapValues(grouped, (records, method) => this[method](records))
    ).bind(this).then(this._handleSaveManyResponse);
  },

  _handleSaveManyResponse({insert, update}) {
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

    // Check if this is an insert for a single record. This determines how the
    // query response is used.
    //
    const isSingle = records.length <= 1 && !isArray(head(records));

    // Normalize records into a flat array, normalizing falsey values to `null`.
    //
    const recordChain = _(records).map(r => r || null).flatten();

    // Short circuit if no truthy values are supplied.
    //
    if (!recordChain.some()) {
      return Promise.resolve(isSingle ? null : recordChain.value());
    }

    const insertRecords = isSingle
      ? recordChain.head()
      : recordChain.value();

    // Pass non-null records to `QueryBuilder`.
    //
    return this.toInsertQueryBuilder(insertRecords)
    .then(response => isSingle
      ? this._handleInsertOneResponse(response, insertRecords)
      : this._handleInsertManyResponse(response, insertRecords)
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
   * the table assigned to this`Mapper`.
   *
   * @param {...Object|Object[]} records
   *   Record, or records, to insert into this `Mapper`'s table.
   * @returns {QueryBuilder}
   *   A Knex `QueryBuilder` that, when executed, will insert supplied `records`.
   */
  toInsertQueryBuilder(...records) {

    // `QueryBuilder#insert` accepts a single row or an array of rows.
    //
    // Not necessary to remove `null` values here, Knex handles this for us.
    //
    // Apply any necessary processing to the records. If these methods haven't
    // been overridden they just default to `_.identity`, and this is a noop.
    //
    const rows = _(records)
      .flatten()
      .map(this.getAttributes, this)
      .map(this.attributesToColumns, this)
      .value();

    // Insert record(s) and return all modified rows. DBMSes other than
    // PostgreSQL will not receive the `RETURNING` command and return
    // the ID of the first inserted model.
    //
    return this.toQueryBuilder().insert(rows, '*');
  },

  /**
   * @method _handleInsertOneResponse
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
  _handleInsertOneResponse(response, record) {

    // We handle inserting `null` records here.
    if (record == null) {
      return null;
    }

    // Handle either an entire response array (if just one model has been
    // inserted). Or handle just a single element from the response array.
    //
    const returned = isArray(response)
      ? head(response)
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
      return this.setAttributes(attributes, record);
    }

    // We can't update a composite key. As I understand, any DBMS other than
    // PostgreSQL can only return auto-incremented keys (and only one of them),
    // so this shouldn't be a problem.
    //
    const idAttribute = this.getOption('idAttribute');
    if (!isList(idAttribute)) {
      return this.setAttribute(idAttribute, returned, record);
    }
  },

  /**
   * @method _handleInsertManyResponse
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
  _handleInsertManyResponse(response, records) {

    let mappedRows;
    if (response.length !== records.length) {

      // TODO: Test this
      //
      // Space out the response object to match the format of the insert records.
      // This allows this contract:
      //
      //     ([
      //       { id: 1, a: 'a' },
      //       { id: 2, b: 'b' }
      //     ], [
      //       { a: 'a' }, null, { b: 'b' }
      //     ]) -> [{ id: 1, a: 'a' }, null, { id: 2, b: 'b' }]
      //
      mappedRows = [];
      for (let i = 0, j = 0; i < records.length && j < response.length; i++) {
        const record = records[i];
        const row = response[j];
        if (record == null) {
          mappedRows.push(null)
        } else {
          mappedRows.push(row)
          j++;
        }
      }
    } else {
      mappedRows = response;
    }
    return zipWith(mappedRows, records, this._handleInsertOneResponse, this);
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

    // Check if we're saving just one record...
    //
    const isSingle = records.length <= 1 && !isArray(head(records));

    records = flatten(records);

    // If so, we can just distribute it directly to the correct method.
    //
    if (isSingle) {
      const record = head(records);
      return this.updateOne(record);
    }

    return this.updateAll(records);
  },

  /**
   * @method updateOne
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
  updateOne(record) {

    // Short circuit if no argument is provided.
    //
    if (!record) {
      return Promise.resolve(null);
    }

    return Promise.try(() =>
      this.toUpdateOneQueryBuilder(record)
    ).tap(response => {

      // Handle either rows or changed count.
      //
      // TODO: Actually assign row values back onto record.
      //
      const count = isArray(response) ? response.length : response;

      // If no row was updated, the record was not present in the database. For
      // now always throw here, forcing consumer code to catch.
      //
      if (count === 0) throw new NotFoundError(
        this, queryBuilder, 'update'
      );

    })
    .return(record);
  },

  /**
   * @method updateAll
   * @belongsTo Mapper
   * @summary
   *
   * Update many records.
   *
   * @description
   *
   * Update the rows corresponding to each record. Each update is done as its
   * own query.
   *
   * @param {Object|Object[]}
   *   Records to be updated.
   * @returns {Promise<Object|Object[]>}
   *   A promise resolving to the updated records.
   */
  updateAll(records) {
    return Promise.all(map(records, this.updateOne, this));
  },

  toUpdateOneQueryBuilder(record) {

    // Get ID attributes as an array.
    //
    const idAttribute = this.getOption('idAttribute');
    const attributeNames = isList(idAttribute)
      ? idAttribute.toArray()
      : [idAttribute];

    // Get ID attribute/value pairs for this record.
    //
    const attributes = this.pickAttributes(attributeNames, record);

    // If fewer attributes were picked than ID attributes on the Mapper, then
    // it cannot reliably be updated.
    //
    if (size(attributes) !== attributeNames.length) {
      throw new UnidentifiableRecordError(this, record, attributeNames);
    }

    // Process attributes for insertion. This is a no-op unless these methods
    // have been overridden.
    //
    const updateColumns = this.attributesToColumns(this.getAttributes(record));
    const whereColumns = this.attributesToColumns(attributes);

    // Update the specific row, appending a `RETURNS` clause if PostgreSQL.
    //
    return this.toQueryBuilder()
      .where(whereColumns)
      .update(updateColumns, '*');
  },

};

export default { methods };
