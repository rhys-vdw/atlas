import { isFunction, isEmpty, isString } from 'lodash/lang';

const options = {
  queryBuilder: null
}

const methods = {

  // -- Query --

  /**
   * @method knex
   * @belongsTo Mapper
   * @summary
   *
   * Set the underlying knex instance of this mapper.
   *
   * @param {Knex} knex
   *   The new name of this table.
   * @returns {Mapper}
   *   Mapper instance with reference to given `Knex` instance.
   */
  knex(knex) {
    const mapper = this.setOption('knex', knex);
    const queryBuilder = mapper.getOption('queryBuilder');

    if (queryBuilder != null) {
      queryBuilder.client = knex.client;
    }

    return mapper;
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
    const mapper = this.setOption('table', table);
    const queryBuilder = mapper.getOption('queryBuilder');

    if (queryBuilder != null) {
      queryBuilder.from(table);
    }
    return mapper;
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
    return this._queryBuilder().clone();
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

    const queryBuilder = this.isMutable()
      ? this._queryBuilder()
      : this.toQueryBuilder();

    if (isFunction(method)) {
      method.call(queryBuilder, queryBuilder);
    } else if (isString(method)) {
      queryBuilder[method](...args);
    }

    return this.setOption('queryBuilder', queryBuilder);
  },

  /**
   * @method _queryBuilder
   * @belongsTo Mapper
   * @private
   * @summary
   *
   * Return or lazily create `QueryBuilder` instance for this mapper.
   *
   * @returns {QueryBuilder} QueryBuilder instance.
   */
  _queryBuilder() {
    let queryBuilder = this.getOption('queryBuilder');
    if (queryBuilder == null) {
      const knex = this.getOption('knex');
      const table = this.getOption('table');
      queryBuilder = knex(table);
      this.setOption('queryBuilder', queryBuilder);
    }
    return queryBuilder;
  }
}

export default { methods, options }
