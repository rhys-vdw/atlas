import { assign } from 'lodash/object';
import { isFunction, isEmpty, isString } from 'lodash/lang';
import Knex from 'knex';

import { NoopError } from '../errors';

const knex = Knex({});

const options = {
  noop: false,
  queryBuilder: knex.queryBuilder(),
};

const methods = {

  // -- No-op --

  isNoop() {
    return this.getOption('noop') !== false;
  },

  assertNotNoop() {
    const reason = this.getOption('noop');
    if (reason !== false) throw new NoopError(this, reason);
  },

  noop(reason) {
    if (!isString(reason)) throw new TypeError(
      `Expected 'reason' to be a string, got: ${reason}`
    );
    return this.setOption('noop', reason);
  },

  // -- Query --

  atlas(atlas) {
    return this.setOption('atlas', atlas);
  },

  knex(knex) {
    return this.client(knex.client);
  },

  client(client) {
    return this.updateOption('queryBuilder', queryBuilder =>
      queryBuilder.client === client
        ? queryBuilder
        : assign(queryBuilder.clone(), {client})
    );
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
      mapper.setOption('table', table);
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
    this.assertNotNoop();
    return this.getOption('queryBuilder').clone();
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
      queryBuilder[method](...args);
    }

    return this.setOption('queryBuilder', queryBuilder);
  },
};

export default { methods, options };
