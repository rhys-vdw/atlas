import {
  isArray, isEmpty, isFunction, isObject, isString, every, reduce, assign, pick
} from 'lodash';
import objectToString from 'object-to-string';
import { inspect } from 'util';

import { UnsetStateError } from './errors';

function createCallSuper(prototype) {
  return function callSuper(self, methodName, ...args) {
    return prototype[methodName].apply(self, args);
  };
}

export default class ImmutableBase {

  /** @private */
  constructor(options = {}) {

    this.state = 'isMutable' in options
      ? options
      : { isMutable: false, ...options };
  }

  toString() {
    const type = this.constructor.name || 'ImmutableBase';
    const stateString = objectToString(this.state, {
      keySeparator: '=', attrSeparator: ', '
    });
    return `[${type}: ${stateString}]`;
  }

  /**
   * @method requireState
   * @belongsTo ImmutableBase
   * @summary
   *
   * Get an option that has previously been set on the model.
   *
   * @param {string} key
   *   State key to retrieve.
   * @returns {mixed}
   *   Value previously assigned to state key. Do not mutate this value.
   * @throws UnsetStateError
   *   If the option has not been set.
   */
  requireState(key) {

    // Options must be initialized before they are accessed.
    if (!(key in this.state)) {
      throw new UnsetStateError(key, this);
    }

    return this.state[key];
  }

  setState(nextState) {

    const isNoop = every(nextState, (value, option) =>
      this.state[option] === value
    );

    if (isNoop) {
      return this;
    }

    // If mutable, set the option and return.
    if (this.isMutable()) {
      assign(this.state, nextState);
      return this;
    }

    // Otherwise duplicate the `nextState` object and pass it on in a new
    // instance.
    return new this.constructor({ ...this.state, ...nextState });
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
   * Creates an inheriting `ImmutableBase` class with supplied `methods`.
   * Returns an instance of this class.
   *
   * @param {Object|function} methodHashesOrFns
   *   Object of methods to be mixed into the class. Or a function that returns
   *   such an object. The function is invoked with a `callSuper` helper
   *   function.
   */
  extend(...methodHashesOrFns) {

    // It's not possible to extend an instance in place.
    if (this.isMutable()) throw new Error(
      'cannot call `extend` when mutable'
    );

    // Create a clone of self.
    class Extended extends this.constructor {}

    // Mix in each set of methods and build an array of initializers.
    const initializers = reduce(methodHashesOrFns, (result, methodsOrFn) => {

      // Support supplying a function that is resolved with a `callSuper`
      // helper.
      const properties = isFunction(methodsOrFn)
        ? methodsOrFn(createCallSuper(this))
        : methodsOrFn;

      // `initialize` is a special case.
      const { initialize, ...methods } = properties;

      // Don't allow assigning values directly to the prototype. This can cause
      // problems when reassigning values (eg. `this.x` is shared between all
      // instances).
      const invalid = pick(methods, isFunction);
      if (invalid.length > 0) throw new TypeError(
        `methods must all be functions, invalid properties: ${inspect(invalid)}`
      );

      // Mix in the new methods.
      assign(Extended.prototype, methods);

      if (initialize != null) {
        result.push(initialize);
      }
      return result;
    }, []);


    // Instantiate the new instance.
    return new Extended(this.state)
      .withMutations(initializers)
      .asImmutable();
  }

  // -- Mutability Controls --


  isMutable() {
    return this.state.isMutable;
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
   * Calling {@link ImmutableBase#setState} usually returns new instace of
   * `ImmutableBase`. A mutable `ImmutableBase` instance can be modified
   * in place.
   *
   * Usually using {@link ImmutableBase#withMutations} is preferable to
   * `asMutable`.
   *
   * @see {@link ImmutableBase#asImmutable}
   * @see {@link ImmutableBase#withMutations}
   *
   * @returns {ImmutableBase} Mutable copy of this instance.
   */
  asMutable() {
    return this.setState({ isMutable: true });
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
    return this.setState({ isMutable: false });
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
   * AustralianWomen = People.withMutations(People => {
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
   * @param {...(Array|string|Object|function)} initializer
   *  An initializer callback, taking the ImmutableBase instance as its first
   *  argument. Alternatively an object of {[method]: argument} pairs to be
   *  invoked.
   *
   * @returns {ImmutableBase}
   *   Mutated copy of this instance.
   */
  withMutations(...initializers) {

    if (every(initializers, initializer =>
      isEmpty(initializer) && !isFunction(initializer))
    ) return this;

    const wasMutable = this.isMutable();

    const instance = this.asMutable().applyInitializers(initializers);

    return wasMutable ? instance : instance.asImmutable();
  }

  /** @private */
  applyInitializers(initializers) {
    return reduce(initializers, (self, initializer) =>
      self.applyInitializer(initializer)
    , this);
  }

  /** @private */
  applyInitializer(initializer) {

    if (initializer == null) {
      return this;
    }

    if (isArray(initializer)) {
      return this.applyInitializers(initializer);
    }

    if (isString(initializer)) {
      return this.invoke(initializer);
    }

    if (isFunction(initializer)) {
      initializer.call(this, this);
      return this;
    }

    if (isObject(initializer)) {
      return reduce(initializer, (self, argument, method) =>
        self.invoke(method, argument)
      , this);
    }

    throw new TypeError(`Unexpected initializer: ${initializer}`);
  }

  /** @private */
  invoke(method, ...args) {
    if (!isFunction(this[method])) throw new TypeError(
      `Could not find method '${method}' on Mapper.`
    );
    return this[method](...args);
  }
}
