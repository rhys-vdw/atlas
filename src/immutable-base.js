import _ from 'lodash';
import { isEmpty, isFunction, isObject } from 'lodash/lang';
import { each, every } from 'lodash/collection';
import { assign } from 'lodash/object';
import objectToString from 'object-to-string';

import { assertType } from './assertions';
import { InvalidOptionError } from './errors';

export default class ImmutableBase {

  /** @private */
  constructor(options = {}) {

    this._options = 'isMutable' in options
      ? options
      : { isMutable: false, ...options };
  }

  toString() {
    const type = this.constructor.name || 'ImmutableBase';
    const options = objectToString(this._options, {
      keySeparator: '=', attrSeparator: ', '
    });
    return `[${type}: ${options}]`;
  }

  /**
   * @method getOption
   * @belongsTo ImmutableBase
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
   * @method setOption
   * @belongsTo ImmutableBase
   * @summary
   *
   * Set an option on the ImmutableBase.
   *
   * @param {string} option
   *   Name of the option to set.
   * @param {mixed} value
   *   New option value.
   * @returns {ImmutableBase}
   *   ImmutableBase instance with option set to value.
   */
  setOption(option, value) {
    return this.setOptions({ [option]: value });
  }

  setOptions(options) {

    const isNoop = every(options, (value, option) =>
      this._options[option] === value
    );

    if (isNoop) {
      return this;
    }

    // If mutable, set the option and return.
    if (this.isMutable()) {
      assign(this._options, options);
      return this;
    }

    // Otherwise duplicate the options object and pass it on in a new instance.
    return new this.constructor({ ...this._options, ...options });
  }

  /**
   * @method updateOption
   * @belongsTo ImmutableBase
   * @summary
   *
   * Update an option on the ImmutableBase.
   *
   * @description
   *
   * Accepts an `update` callback invoked with the current value for the
   * specified `option`. The value returned from `update` will be set
   * on the `ImmutableBase`'s option hash.
   *
   * Never mutate the previous value directly. If the option is a mutable value
   * such as an `Object` or `Array` it must be copied before being returned by
   * the `updater`.
   *
   * @param {string} option
   *   Name of the option to set.
   * @param {function} updater
   *   Callback receiving the current option value, and returning the new value.
   * @returns {ImmutableBase}
   *   ImmutableBase instance with option updated to value returned by `updater`.
   */
  updateOption(option, updater) {
    const value = this.getOption(option);
    return this.setOption(option, updater(value));
  }

  /**
   * @method extend
   * @belongsTo ImmutableBase
   * @summary
   *
   * Create a new ImmutableBase instance with custom methods.
   *
   * @description
   *
   * Creates an inheriting `ImmutableBase` class with supplied `methods`. Returns an
   * instance of this class.
   *
   * @param {Object} methods
   *
   */
  extend(methods) {

    // It's not possible to extend an instance in place.
    if (this.isMutable()) throw new Error(
      'cannot call `extend` when mutable'
    );

    // Create a clone of self.
    class Extended extends this.constructor {}

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
    assign(Extended.prototype, methods);

    // Instantiate the new instance.
    return new Extended(this._options)
      .withMutations(initializer)
      .asImmutable();
  }

  // -- Mutability Controls --


  isMutable() {
    return this.getOption('isMutable');
  }

  /**
   * @method asMutable
   * @belongsTo ImmutableBase
   * @summary
   *
   * Create a mutable copy of this instance.
   *
   * @description
   *
   * Calling {@link ImmutableBase#query}, {@link ImmutableBase#setOption} or other methods
   * usually return new instaces of `ImmutableBase`. A mutable `ImmutableBase` instance can
   * be modified in place.
   *
   * Usually using {@link ImmutableBase#withMutations} is preferable to `asMutable`.
   *
   * @see {@link ImmutableBase#asImmutable}
   * @see {@link ImmutableBase#withMutations}
   *
   * @returns {ImmutableBase} Mutable copy of this instance.
   */
  asMutable() {
    return this.setOption('isMutable', true);
  }

  /**
   * @method asImmutable
   * @belongsTo ImmutableBase
   * @summary
   *
   * Prevent this instance from being mutated further.
   *
   * @returns {ImmutableBase} This instance.
   */
  asImmutable() {
    return this.setOption('isMutable', false);
  }

  /**
   * @method withMutations
   * @belongsTo ImmutableBase
   * @summary
   *
   * Create a mutated copy of this instance.
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
   *  An initializer callback, taking the ImmutableBase instance as its first
   *  argument. Alternatively an object of {[method]: argument} pairs to be
   *  invoked.
   *
   * @returns {ImmutableBase}
   *   Mutated copy of this instance.
   */
  withMutations(initializer) {
    if (!isFunction(initializer) && isEmpty(initializer)) return this;

    assertType({ initializer }, { function: isFunction, Object: isObject });

    const wasMutable = this.isMutable();

    const instance = this.asMutable()._applyInitializer(initializer);

    return wasMutable ? instance : instance.asImmutable();
  }

  _applyInitializer(initializer) {

    if (_.isFunction(initializer)) {
      return this._applyInitializerCallback(initializer);
    }

    return this._applyInitializerObject(initializer);
  }

  _applyInitializerCallback(callback) {
    callback.bind(this)(this);
    return this;
  }

  _applyInitializerObject(object) {

    each(object, (argument, method) => {
      if (!isFunction(this[method])) throw new TypeError(
        `Could not find method '${method}' on Mapper.`
      );
      this[method](argument);
    });

    return this;
  }
}
