import _ from 'lodash';
import { isFunction, isObject, isEmpty, isString } from 'lodash/lang';
import { each, every } from 'lodash/collection';
import { assign } from 'lodash/object';

import { InvalidOptionError } from '../errors';
import { assertType } from '../assertions';

export default class Mapper {

  /**
   * @class Mapper
   * @constructor
   * @summary
   *
   * Construct a new `Mapper`.
   *
   * @description
   *
   * {@link Mapper}'s constructor should never be called directly. This
   * constructor is utilized internally by Atlas. New `Mapper` instances are
   * created automatically whenever an option is {@link Mapper#setOption set},
   * or when the underlying `QueryBuilder` is {@link Mapper#query modified}.
   *
   * @param {Object} [options={}]
   *   Initial options object. It's assumed that this instance will not be
   *   mutated.
   * @param {QueryBuilder} [queryBuilder]
   *   Initial `QueryBuilder` instance. It's assumed that this instance not be
   *   mutated.
   * @param {bool} [mutable=false]
   *   Initialize the instance as mutable?
   */
  constructor(options = {}, queryBuilder = null, mutable = false) {
    if (mutable) {
      this._options = { ...options};
      this._query = queryBuilder && queryBuilder.clone();
    } else {
      this._options = options;
      this._query = queryBuilder;
    }
    this._mutable = mutable;
  }


  /**
   * @method extend
   * @belongsTo Mapper
   * @summary
   *
   * Create a new Mapper instance with custom methods.
   *
   * @description
   *
   * Creates an inheriting `Mapper` class with supplied `methods`. Returns an
   * instance of this class.
   *
   * @param {Object} methods
   *   
   */
  extend(methods) {

    // Don't leak mutable state into the new instance.
    if (this._mutable) throw new Error(
      'cannot call `extend` on a mutable `Mapper`'
    );

    // Create a clone of self.
    class ChildMapper extends this.constructor {}

    // `initialize` is a special case.
    const initializer = methods.initialize;
    if (initializer) {
      delete methods.initialize;
    }

    // Don't allow assigning values directly to the prototype. This can cause
    // problems when reassigning values (eg. `this.x` is shared between all
    // instances).
    if (!every(methods, isFunction)) throw new Error(
      '`methods` must all be functions'
    );

    // Mix in the new methods.
    assign(ChildMapper.prototype, methods);

    // Instantiate the instance as 
    return new ChildMapper(this._options, this._query, true)
      .withMutations(initializer)
      .asImmutable();
  }

  // -- Mutability Controls --

  /**
   * @method asMutable
   * @belongsTo Mapper
   * @summary
   *
   * Create a mutable copy of this Mapper.
   *
   * @description
   *
   * Calling {@link Mapper#query}, {@link Mapper#setOption} or other methods
   * usually return new instaces of Mapper. A mutable Mapper instance can
   * be modified in place.
   *
   * Usually using {@link Mapper#withMutations} is preferable to `asMutable`.
   *
   * @see {@link Mapper#asImmutable}
   * @see {@link Mapper#withMutations}
   *
   * @returns {Mapper} Mutable copy of this Mapper.
   */
  asMutable() {
    return this._mutable
      ? this
      : new this.constructor(this._options, this._query, true);
  }

  /**
   * @method asImmutable
   * @belongsTo Mapper
   * @summary
   *
   * Prevent this instance from being mutated further.
   *
   * @returns {Mapper} This Mapper.
   */
  asImmutable() {
    this._mutable = false;
    return this;
  }

  /**
   * @method withMutations
   * @belongsTo Mapper
   * @summary
   *
   * Create a mutated copy of this Mapper.
   *
   * @example <caption>Using a callback initializer</caption>
   *
   * AustralianWomen = People.withMutations((People) => {
   *  People
   *    .where({ country: 'Australia', gender: 'female' });
   *    .withRelated('spouse', 'children', 'jobs')
   * });
   *
   * @example <caption>Using an object initializer</caption>
   *
   * AustralianWomen = People.withMutations({
   *  where: { country: 'Australia', gender: 'female' },
   *  withRelated: ['spouse', 'children', 'jobs']
   * });
   *
   * @example <caption>Returning an object initializer</caption>
   *
   * AustralianWomen = People.withMutations(() => {
   *   return {
   *     where: { country: 'Australia', gender: 'female' },
   *     withRelated: ['spouse', 'children', 'jobs']
   *   }
   * });
   *
   * @param {?(Object|function)} initializer
   *  An initializer callback, taking the Mapper instance as its first argument.
   *  Alternatively an object of {[method]: argument} pairs to be invoked upon
   *  the mapper. If a function is provided it may also return an initializer.
   * @returns {Mapper}
   *   Mutated copy of this Mapper.
   */
  withMutations(initializer) {
    if (!isFunction(initializer) && isEmpty(initializer)) return this;

    assertType({ initializer }, { function: isFunction, Object: isObject });

    const wasMutable = this._mutable;

    const mapper = this.asMutable()._applyInitializer(initializer);

    return wasMutable ? mapper : mapper.asImmutable();
  }

  _applyInitializer(initializer) {

    if (_.isFunction(initializer)) {
      return this._applyInitializerCallback(initializer)
    }

    return this._applyInitializerObject(initializer)
  }

  _applyInitializerCallback(callback) {

    const initializer = callback.bind(this)(this);

    if (initializer) {
      this._applyInitializer(initializer);
    }

    return this;
  }

  _applyInitializerObject(object) {

    each(object, (argument, method) => {
      assertType({method: mapper[method]}, {function: isFunction});
      this[method](argument);
    });

    return this;
  }

  // -- Options --

  /**
   * @method getOption
   * @belongsTo Mapper
   * @summary
   *
   * Get an option that has previously been set on the model.
   *
   * @param {string} option
   *   Name of the option to set.
   * @returns {mixed}
   *   Value previously assigned to option. Do not mutate this value.
   * @throws InvalidOptionError
   *   If the option has not been set.
   */
  getOption(option) {

    // Options must be initialized before they are accessed.
    if (!(option in this._options)) {
      throw new InvalidOptionError(option, this);
    }

    return this._options[option];
  }

  /**
   * @method getOptions
   * @belongsTo Mapper
   * @summary
   *
   * Get multiple option values mapped to an Object.
   *
   * @param {...string|string[]} options
   *   Names of options to retrieve.
   * @returns {Object}
   *   Object mapping options to values.
   */
  getOptions(...options) {
    return _(options)
      .flatten() // Allow either (...options) or options[]
      .map(option => [option, this.getOption(option)])
      .zipObject()
      .value();
  }
 
  /**
   * @method setOption
   * @belongsTo Mapper
   * @summary
   *
   * Set an option on the Mapper.
   *
   * @param {string} option
   *   Name of the option to set.
   * @param {mixed} value
   *   New option value.
   * @returns {Mapper}
   *   Mapper instance with option set to value.
   */
  setOption(option, value) {

    // Setting an option to its current value is a no-op.
    if (this._options[option] === value) {
      return this;
    }

    // If mutable, set the option and return.
    if (this._mutable) {
      this._options[option] = value;
      return this;
    }

    // Otherwise duplicate the options object and pass it on in a new instance.
    const options = { ...this._options, [option]: value };
    return new this.constructor(options, this._query);
  }

  /**
   * @method updateOption
   * @belongsTo Mapper
   * @summary
   *
   * Update an option on the Mapper.
   *
   * @description
   *
   * Accepts an `update` callback invoked with the current value for the
   * specified `option`. The value returned from `update` will be set
   * on the `Mapper`'s option hash.
   *
   * Never mutate the previous value directly. If the option is a mutable value
   * such as an `Object` or `Array` it must be copied before being returned by
   * the `updater`.
   *
   * @param {string} option
   *   Name of the option to set.
   * @param {function} updater
   *   Callback receiving the current option value, and returning the new value.
   * @returns {Mapper}
   *   Mapper instance with option updated to value returned by `updater`.
   */
  updateOption(option, updater) {
    const value = this.getOption(option);
    return this.setOption(option, updater(value));
  }

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
    if (mapper !== this && mapper._query) {
      mapper._query.client = knex.client;
    }
    return mapper;
  }

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
    if (mapper !== this && mapper._query) {
      mapper._query.from(table);
    }
    return mapper;
  }

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
  }

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

    const queryBuilder = this._mutable
      ? this._queryBuilder()
      : this.toQueryBuilder();

    if (isFunction(method)) {
      method.call(queryBuilder, queryBuilder);
    }

    if (isString(method)) {
      queryBuilder[method](...args);
    }

    return this._mutable
      ? this
      : new this.constructor(this._options, queryBuilder);
  }

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
    if (this._query == null) {
      const { knex, table } = this.getOptions('knex', 'table');
      this._query = knex(table);
    }
    return this._query;
  }

  toString() {
    return `
      options:
      --------
      ${this._options.toString()}

      query:
      ------
      ${this._query && this._query.toString()}
      `
  }
}
