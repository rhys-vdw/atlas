import { NotFoundError, NoRowsFoundError } from '../errors';

const methods = {

  /**
   * @method Mapper.destroy
   * @belongsTo module:mapper/destruction
   * @summary
   *
   * Delete rows.
   *
   * @description
   *
   * Delete all rows matching the current query, or specify specific rows to be
   * deleted. Rows can be specified by supplying one or more record objects with
   * IDs, or ID values.
   *
   * @example
   *
   * const Users = atlas('Mapper').table('users');
   *
   * Users.destroy(5).then(count => 
   *   // delete from users where id = 5
   *   // count === 1
   * );
   *
   * Users.destroy(1, 2, 3).then(count =>
   *   // delete from users where id in (1, 2, 3)
   *   // count === 3
   * );
   *
   * const sam = { id: 5, name: 'Sam' };
   * const jane = { id: 16, name: 'Jane' };
   *
   * Users.destroy(sam, jane).then(count =>
   *   // delete from users where id in (5, 16)
   *   // count === 2
   * );
   *
   * Users.where('complaint_count', '>', 10).destroy().then(count =>
   *   // delete from users where complaint_count > 10;
   *   // count === 0   :-)
   * );
   *
   * @param {...mixed|mixed[]} [ids]
   *   ID(s) or record(s) whose corresponding rows will be destroyed.
   * @returns {Promise<Number>}
   *   Promise resolving to the number of rows deleted.
   */
  destroy(...ids) {
    const mapper = this.target(...ids);
    const queryBuilder = mapper.toDestroyQuery();
    return queryBuilder.then(response =>
      this._handleDestroyResponse({ response, queryBuilder })
    );
  },

  /**
   * @method Mapper.toDestroyQuery
   * @belongsTo module:mapper/destruction
   * @summary
   *
   * Generate a delete query.
   *
   * @description
   *
   * Generates a Knex `QueryBuilder` object that deletes rows from the table
   * assigned to this `Mapper`.
   *
   * @returns {QueryBuilder}
   *   A Knex `QueryBuilder` that, when executed, will delete specified rows.
   */
  toDestroyQuery() {
    return this.toQueryBuilder().delete();
  },

  /** @private **/
  _handleDestroyResponse({ response, queryBuilder }) {
    if (response === 0) {
      const isSingle = this.getOption('isSingle');
      throw isSingle
        ? new NotFoundError(this, queryBuilder, 'destroy')
        : new NoRowsFoundError(this, queryBuilder, 'destroy');
    }
    return response;
  }
}

/**
 * Methods pertaining to removing records from the database.
 *
 * @exports module:mapper/destruction
 */
export default { methods };
