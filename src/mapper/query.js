import { isFunction, isEmpty, isString, assign } from 'lodash';
import Knex from 'knex';

const knex = Knex({});

export default {

  initialize() {
    this.setState({ queryBuilder: knex.queryBuilder() });
  },

  atlas(atlas) {
    return this.setState({ atlas });
  },

  knex(knex) {
    return this.client(knex.client);
  },

  client(client) {
    const { queryBuilder } = this.state;
    return this.setState({ queryBuilder:
      queryBuilder.client === client
        ? queryBuilder
        : assign(queryBuilder.clone(), { client })
    });
  },

  /**
   * @method table
   * @belongsTo Mapper
   * @summary
   *
   * Sets the name of the table targeted by this Mapper.
   *
   * @param {string} table
   *   The new name of this table.
   * @returns {Mapper}
   *   Mapper instance targeting given table.
   */
  table(table) {
    return this.withMutations(mapper => {
      mapper.setState({ table });
      mapper.query('from', table);
    });
  },

  /**
   * @method toQueryBuilder
   * @belongsTo Mapper
   * @summary
   *
   * Return a copy of the underlying `QueryBuilder` instance.
   *
   * @see {@link http://knexjs.org}
   * @returns {QueryBuilder} QueryBuilder instance.
   */
  toQueryBuilder() {
    return this.state.queryBuilder.clone();
  },

  /**
   * @method query
   * @belongsTo Mapper
   * @summary
   *
   * Modify the underlying Knex `QueryBuilder` instance directly.
   *
   * @see {@link http://knexjs.org}
   *
   * @param {function|string} method
   *   A callback that modifies the underlying `QueryBuilder` instance, or the
   *   name of a `QueryBuilder` method to invoke.
   * @param {...mixed} [args]
   *   Arguments to be passed to the `QueryBuilder` method.
   * @returns {Mapper}
   *   Mapper with a modified underlying `QueryBuilder` instance.
   */
  query(method, ...args) {

    if (!isFunction(method) && isEmpty(method)) return this;

    const queryBuilder = this.toQueryBuilder();

    if (isFunction(method)) {
      method.call(queryBuilder, queryBuilder);
    } else if (isString(method)) {
      if (!isFunction(queryBuilder[method])) throw new TypeError(
        `Unknown method 'QueryBuilder#${method}'`
      );
      queryBuilder[method](...args);
    }

    return this.setState({ queryBuilder });
  },


  noop() {
    return this.query(queryBuilder => {
      // Doesn't matter which string is supplied for the column name.
      queryBuilder.whereIn('', []);
    });
  },
};
