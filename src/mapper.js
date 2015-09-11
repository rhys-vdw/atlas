import Immutable, { Iterable } from 'immutable';
import _ from 'lodash';
import { isFunction, isObject, isEmpty } from 'lodash/lang';
import { each } from 'lodash/collection';
import { assign } from 'lodash/object';

import { assertType } from './assertions';

export default class Mapper {

  /**
   * @class Mapper
   * @constructor
   *
   * A {@link Mapper} should never be instantiated directly.
   *
   * @param {Object|Immutable.Map} options
   * @param {?QueryBuilder} [query]
   */
  constructor(options = {}, query = null) {

    // Convert options to Immutable.
    // Call to `AsImmutable` ensures that `options` object is not currently in a
    // mutable state (eg. if `options = new Map().AsMutable()`).
    this._options = Immutable.fromJS(options).asImmutable();

    // Copy `query` here to prevent leaking mutable state.
    this._query = query ? query.clone() : null;

    // This instance is mutable for the duration of the constructor.
    this._mutable = true;

    // Now allow extra mutations to be set by inheriting class. Typically
    // setting options or the query.
    this.withMutations(this.initialize);

    // Now lock it down. We return it in the off chance that `extend` was called
    // in a callback.
    this.asImmutable();
  }


  /**
   * @method extend
   * @belongsTo Mapper
   *
   * Create a new Mapper instance with given methods.
   */
  extend(methods) {
    // Create a clone of self.
    class ChildMapper extends this.constructor {}

    // Mix in the new methods.
    assign(ChildMapper.prototype, methods);

    // Instantiate the instance.
    return new ChildMapper(this._options, this._query);
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
    if (this._mutable) {
      return this;
    }

    const result = new this.constructor(this._options, this._query);
    result._mutable = true;
    return result;
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
    if (isEmpty(initializer)) return this;

    assertType( { initializer }, { function: isFunction, Object: isObject });

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
   *   Value previously assigned to option.
   * @throws InvalidOptionError
   *   If the option has not been set.
   */
  getOption(option) {

    // Options must be initialized before they are accessed.
    if (!this._options.has(option)) {
      throw new InvalidOptionError(option, this);
    }

    const result = this._options.get(option);

    // Have to ensure references are immutable. Mutable mapper chains
    // could leak.
    return Iterable.isIterable(result)
      ? result.asImmutable()
      : result;
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

    // The first time we call 'setMutability' on `_options` while mutable,
    // it will return a mutable copy. Each additional call will return the
    // same instance.
    //
    // Wrapping the value in `Immutable.fromJS` will cause all Arrays and
    // Objects to be converted into their immutable counterparts.
    //
    // Calls to `_setMutability` and `Immutable.fromJS` will often be
    // called redundantly. This is meant to ensure that the fewest possible
    // copies are constructed.
    //
    const newOptions = this._setMutability(this._options)
      .set(option, Immutable.fromJS(value));

    // If there was a change, return the new instance.
    return newOptions === this._options
      ? this : new this.constructor(newOptions, this._query);
  }

  /**
   * @method updateOption
   * @belongsTo Mapper
   * @summary
   *
   * Update an option on the Mapper.
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

  _setMutability(object) {
    return object[this._mutable ? 'asMutable' : 'asImmutable']();
  }
}
