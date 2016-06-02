import {
  isArray, isEmpty, isFunction, isObject, isString, every, reduce, assign, pick
} from 'lodash';
import objectToString from 'object-to-string';
import { inspect } from 'util';

import { UnsetStateError } from './errors';

function createCallSuper(prototype) {

  /**
   * @callback ImmutableBase~callSuper
   * @summary
   *
   * Helper method that invokes a super method.
   *
   * @example
   *
   * ```js
   * // Invoke super with `callSuper` helper.
   * const child = parent.extend(callSuper => {
   *   return {
   *     method(x, y) {
   *       return callSuper('method', x, y);
   *     }
   *   }
   * });
   *
   * // Equivalent manual invocation of super method.
   * const parentProto = Object.getPrototypeOf(parent);
   * const child = parent.extend({
   *   method(x, y) {
   *     return parentProto.method.call(this, x, y);
   *   });
   * });
   * ```
   *
   * @param {ImmutableBase} self
   *   Instance invoking the super method (`this` in method).
   * @param {string} methodName
   *   Name of super method to invoke.
   * @returns {mixed}
   *   The return value of invoked method.
   */
  return function callSuper(self, methodName, ...args) {
    return prototype[methodName].apply(self, args);
  };
}


/**
 * @callback ImmutableBase~extendCallback
 * @param {ImmutableBase~callSuper} callSuper
 *   Helper function that invokes a super method.
 * @returns {Object}
 *   A hash of methods.
 */

/**
 * Base class for {@link Mapper}.
 */
class ImmutableBase {

  /** @private */
  constructor(options = {}) {

    /**
     * @summary
     *
     * Hash of values that constitute the object state.
     *
     * @description
     *
     * Typically accessed from methods when extending `ImmutableBase`.
     *
     * `state` should be considered read-only, and should only ever by modified
     * indirectly via {@link ImmutableBase#setState setState}.
     *
     * @member {Object} ImmutableBase#state
     * @readonly
     * @see ImmutableBase#requireState
     */
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
   * @method ImmutableBase#requireState
   * @summary
   *
   * Get a state value or throw if unset.
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

  /**
   * @method ImmutableBase#setState
   * @summary
   *
   * Create a new instance with altered state.
   *
   * @description
   *
   * Update {@link ImmutableBase#state state}. If any provided values differ
   * from those already set then a copy with updated state will be returned.
   * Otherwise the same instance is returned.
   *
   * @param {Object} nextState
   *   A hash of values to override those already set.
   * @returns {ImmutableBase}
   *   A new instance with updated state, or this one if nothing changed.
   */
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
   * @method ImmutableBase#extend
   * @summary
   *
   * Apply one or more mixins.
   *
   * @description
   *
   * Create a new `ImmutableBase` instance with custom methods.
   *
   * Creates a new class inheriting `ImmutableBase` class with supplied
   * methods.
   *
   * Returns an instance of the new class, as it never needs instantiation with
   * `new`. Copied as instead created via
   * {@link ImmutableBase#setState setState}.
   *
   * ```js
   * import { ReadOnlyError } from './errors';
   *
   * const ReadOnlyMapper = Mapper.extend({
   *   insert() { throw new ReadOnlyError(); },
   *   update() { throw new ReadOnlyError(); }
   * });
   * ```
   *
   * If overriding methods in the parent class, a callback argument can be
   * passed instead. It will be invoked with the `callSuper` function as an
   * argument.
   *
   * ```js
   * function compileRelatedDsl(string) {
   *   // TODO: implement useful DSL.
   *   return atlas.related(string.split(', '));
   * }
   *
   * const DslMapper = Mapper.extend(callSuper => {
   *   return {
   *     with(related) {
   *       if (isString(related)) {
   *         return callSuper(this, 'with', compileRelatedDsl(related));
   *       }
   *       return callSuper(this, 'with', ...arguments);
   *     }
   *   };
   * });
   *
   * const Users = DslMapper.table('users').relations({
   *   account: () => hasOne('Account'),
   *   projects: () => hasMany('Projects')
   * });
   *
   * Users.with('account, projects').fetch().then(users =>
   * ```
   *
   * @param {...(Object|ImmutableBase~extendCallback)} callbackOrMethodsByName
   *   Object of methods to be mixed into the class. Or a function that returns
   *   such an object. The function is invoked with a `callSuper` helper
   *   function.
   * @returns {ImmutableBase}
   *   An instance of the new class inheriting from `ImmutableBase`.
   */
  extend(...callbackOrMethodsByName) {

    // It's not possible to extend an instance in place.
    if (this.isMutable()) throw new Error(
      'cannot call `extend` when mutable'
    );

    // Create a clone of self.
    class Extended extends this.constructor {}

    // Mix in each set of methods and build an array of initializers.
    const initializers = reduce(callbackOrMethodsByName, (result, methodsOrFn) => {

      // Support supplying a function that is resolved with a `callSuper`
      // helper.
      const properties = isFunction(methodsOrFn)
        ? methodsOrFn(createCallSuper(Object.getPrototypeOf(this)))
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


  /** @private */
  isMutable() {
    return this.state.isMutable;
  }

  /**
   * @method ImmutableBase#asMutable
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
   * Typically {@link ImmutableBase#withMutations} is preferable to
   * `asMutable`.
   *
   * @see ImmutableBase#asImmutable
   * @see ImmutableBase#withMutations
   *
   * @returns {ImmutableBase} Mutable copy of this instance.
   */
  asMutable() {
    return this.setState({ isMutable: true });
  }

  /**
   * @method ImmutableBase#asImmutable
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
   * @method ImmutableBase#withMutations
   * @summary
   *
   * Create a mutated copy of this instance.
   *
   * @example <caption>Using a callback initializer</caption>
   *
   * AustralianWomen = People.withMutations(People => {
   *  People
   *    .where({ country: 'Australia', gender: 'female' });
   *    .with(related('spouse', 'children', 'jobs'))
   * });
   *
   * @example <caption>Using an object initializer</caption>
   *
   * AustralianWomen = People.withMutations({
   *   where: { country: 'Australia', gender: 'female' },
   *   with: related('spouse', 'children', 'jobs')
   * });
   *
   * @example <caption>Returning an object initializer</caption>
   *
   * AustralianWomen = People.withMutations(() => {
   *   return {
   *     where: { country: 'Australia', gender: 'female' },
   *     with: related('spouse', 'children', 'jobs')
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

export default ImmutableBase;
