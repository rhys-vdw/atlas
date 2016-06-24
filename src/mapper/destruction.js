import { isEmpty } from 'lodash';
import { NotFoundError, NoRowsFoundError } from '../errors';
import { inspect } from 'util';
import { isQueryBuilderJoined } from './helpers/knex';

export default {

  /**
   * @method Mapper#destroy
   * @summary
   *
   * Delete specific rows.
   *
   * @description
   *
   * Specify rows to be deleted. Rows can be specified by supplying one or more
   * record objects or ID values.
   *
   * @example
   *
   * const Users = atlas('Mapper').table('users');
   *
   * Users.destroy(5).then(count =>
   * // delete from users where id = 5
   *
   * Users.destroy(1, 2, 3).then(count =>
   * // delete from users where id in (1, 2, 3)
   *
   * const sam = { id: 5, name: 'Sam' };
   * const jane = { id: 16, name: 'Jane' };
   *
   * Users.destroy(sam, jane).then(count =>
   * // delete from users where id in (5, 16)
   *
   * @param {...mixed|mixed[]} ids
   *   ID(s) or record(s) whose corresponding rows will be destroyed.
   * @returns {Promise<Number>}
   *   Promise resolving to the number of rows deleted.
   */
  destroy(...ids) {
    const mapper = this.prepareDestroy(...ids);
    const queryBuilder = mapper.toQueryBuilder();
    return queryBuilder.then(response =>
      mapper._handleDestroyResponse({ response, queryBuilder })
    );
  },

  /**
   * @method Mapper#destroyAll
   * @summary
   *
   * Delete rows matching query.
   *
   * @description
   *
   * Delete all rows matching the current query.
   *
   * ```
   * Users.where('complaint_count', '>', 10).destroy().then(count =>
   * ```
   *
   * @returns {Promise<Number>} Count or rows deleted.
   */
  destroyAll() {
    const mapper = this.prepareDestroyAll();
    const queryBuilder = mapper.toQueryBuilder();
    return queryBuilder.then(response =>
      mapper._handleDestroyResponse({ response, queryBuilder })
    );
  },

  /**
   * @method Mapper#prepareDestroy
   * @private
   * @summary
   *
   * Prepare a delete query.
   *
   * @description
   *
   * Prepares internal `QueryBuilder` to delete one or more records from the
   * database.
   *
   * @returns {Mapper}
   *   Mapper with `DELETE` query.
   */
  prepareDestroy(...ids) {
    if (isEmpty(ids)) throw new TypeError(
      `'destroy' expects one or more IDs or records, got ${inspect(ids)}. ` +
      `Did you mean to call 'destroyAll()'?`
    );
    return this.mutate(mapper => {
      mapper.target(...ids).prepareDestroyAll();
    });
  },

  /** @private */
  prepareDestroyAll() {
    return this.mutate(mapper => {

      // Delete statements do not support joins, so filter by ID.
      if (isQueryBuilderJoined(this)) {
        const idAttribute = this.requireState('idAttribute');
        mapper.whereIn(idAttribute, this);
      }

      mapper.query('delete');
    });
  },

  /** @private **/
  _handleDestroyResponse({ response, queryBuilder }) {
    if (this.state.isRequired && response === 0) {
      throw this.state.isSingle
        ? new NotFoundError(this, queryBuilder, 'destroy')
        : new NoRowsFoundError(this, queryBuilder, 'destroy');
    }
    return response;
  }
};
