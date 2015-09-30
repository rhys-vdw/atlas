import _ from 'lodash';
import { clone, isEmpty, isFunction, isObject } from 'lodash/lang';
import { each, every } from 'lodash/collection';
import { assign } from 'lodash/object';
import objectToString from 'object-to-string';

import { assertType } from './assertions';
import { InvalidOptionError } from './errors';

/**
 * Invokes `clone` on any values that have it. This means that QueryBuilders
 * (or any other custom mutable object) can be cloned.
 */
function cloneCustomizer(option) {
  if (isFunction(option.clone)) {
    return option.clone();
  }
}

function cloneOptions(options) {
  return clone(options, cloneCustomizer)
}

export default class Options {

  /** @private */
  constructor(options = {}) {

    if (!('isMutable' in options)) {
      options = { isMutable: false, ...options }
    }

    this._options = options.isMutable
      ? cloneOptions(options)
      : options;
  }

  toString() {
    const type = this.constructor.name || 'Options';
    const options = objectToString(this._options, {
      keySeparator: '=', attrSeparator: ', '
    });
    return `[${type}: ${options}]`;
  }

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
    if (this.isMutable()) {
      this._options[option] = value;
      return this;
    }

    // Otherwise duplicate the options object and pass it on in a new instance.
    const options = { ...this._options, [option]: value };
    return new this.constructor(options);
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
    return this.setOption('isMutable', true);
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
    return this.setOption('isMutable', false);
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

    const wasMutable = this.isMutable();

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
    callback.bind(this)(this);
    return this;
  }

  _applyInitializerObject(object) {

    each(object, (argument, method) => {
      assertType({method: this[method]}, {function: isFunction});
      this[method](argument);
    });

    return this;
  }
}
