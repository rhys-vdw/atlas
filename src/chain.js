import { isFunction, every, reduce, assign, pick } from 'lodash';
import objectToString from 'object-to-string';
import { inspect } from 'util';

import { UnsetStateError } from './errors';

function combineFunctions(fns) {
  return function(...args) {
    fns.map(fn => fn.apply(this, args));
  };
}

function createCallSuper(prototype) {

  /**
   * @callback Chain~callSuper
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
   * @param {Chain} self
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
 * @callback Chain~extendCallback
 * @param {Chain~callSuper} callSuper
 *   Helper function that invokes a super method.
 * @returns {Object}
 *   A hash of methods.
 */

/**
 * Immutable chain builder.
 */
class Chain {

  /**
   * @summary Create a new chain
   * @description
   *
   * Creates and {@link initialize}s a new instance of {@link Chain}.
   *
   * The new instance's {@link state} object can provided via the `state`
   * argument. If this argument is provided then {@link initialize} *will not
   * be invoked*.
   *
   * @param {Object} [state]
   *   Initial state object for this instance. A reference to this object
   *   should not be retained by calling code.
   */
  constructor(state = undefined) {

    if (state == null) {

      /**
       * @summary
       *
       * Hash of values that constitute the chain state.
       *
       * @description
       *
       * Typically accessed from methods when extending {@link Chain}.
       *
       * `state` should be considered read-only, and should only ever by modified
       * indirectly via {@link Chain#setState setState}.
       *
       * @member {Object} Chain#state
       * @readonly
       * @see Chain#requireState
       */
      this.state = { isMutable: true };

      // Now initialize. This should set any desired state values.
      this.initialize();

      // Seal the instance once initialized.
      this.asImmutable();

    } else {
      this.state = 'isMutable' in state
        ? state
        : { isMutable: false, ...state };
    }
  }

  /**
   * @summary Initialize a new chain.
   *
   * This method is invoked when a new chain instance is constructed.
   * Prefer to override this method instead of {@link constructor}.
   *
   * As in {@link mutate}, the chain instance is treated as
   * {@link asMutable mutable} while initialize is running.
   *
   * @protected
   */
  initialize() { /* empty */ }

  toString() {
    const type = this.constructor.name || 'Chain';
    const stateString = objectToString(this.state, {
      keySeparator: '=', attrSeparator: ', '
    });
    return `[${type}: ${stateString}]`;
  }

  /**
   * @method Chain#requireState
   * @summary
   *
   * Get a state value or throw if unset.
   *
   * @param {string} key
   *   Key of state value to retrieve.
   * @returns {mixed}
   *   Value previously assigned to state key. Do not mutate this value.
   * @throws UnsetStateError
   *   If the option has not been set.
   */
  requireState(key) {

    if (!(key in this.state)) {
      throw new UnsetStateError(key, this);
    }

    return this.state[key];
  }

  /**
   * @method Chain#setState
   * @summary
   *
   * Create a new instance with altered state.
   *
   * @description
   *
   * Update {@link Chain#state state}. If any provided values differ
   * from those already set then a copy with updated state will be returned.
   * Otherwise the same instance is returned.
   *
   * @param {Object} nextState
   *   A hash of values to override those already set.
   * @returns {Chain}
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
   * @method Chain#extend
   * @summary
   *
   * Apply one or more mixins.
   *
   * @description
   *
   * Create a new `Chain` instance with custom methods.
   *
   * Creates a new class inheriting `Chain` class with supplied
   * methods.
   *
   * Returns an instance of the new class, as it never needs instantiation with
   * `new`. Copied as instead created via
   * {@link Chain#setState setState}.
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
   * const SPLIT_COMMA = /,\s+/;
   * const SPLIT_RELATED = /(\w*)(?:\((.*)\))?/;
   *
   * function compileDsl(string) {
   *   return string.split(SPLIT_COMMA).map(token => {
   *     const [_, relationName, nested] = token.match(SPLIT_RELATED);
   *     const relatedInstance = atlas.related(relationName);
   *     return nested ? relatedInstance.with(compileDsl(nested)) : relatedInstance;
   *   });
   * }
   *
   * const DslMapper = Mapper.extend(callSuper => {
   *   return {
   *     with(related) {
   *       if (isString(related)) {
   *         return callSuper(this, 'with', compileDsl(related));
   *       }
   *       return callSuper(this, 'with', ...arguments);
   *     }
   *   };
   * });
   *
   * const Users = DslMapper.table('users').relations({
   *   account: m => m.hasOne('Account'),
   *   projects: m => m.hasMany('Projects')
   * });
   *
   * Users.with('account, projects(collaborators, documents)').fetch().then(users =>
   * ```
   *
   * @param {...(Object|Chain~extendCallback)} callbackOrMethodsByName
   *   Object of methods to be mixed into the class. Or a function that returns
   *   such an object. The function is invoked with a `callSuper` helper
   *   function.
   * @returns {Chain}
   *   An instance of the new class inheriting from `Chain`.
   */
  extend(...callbackOrMethodsByName) {

    // It's not possible to extend an instance in place.
    if (this.isMutable()) throw new Error(
      'cannot call `extend` when mutable'
    );

    // Create a clone of self.
    class Extended extends this.constructor {}

    // Mix in each set of methods and build an array of initializers.
    const initializers = reduce(callbackOrMethodsByName,
    (result, methodsOrFn) => {

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
      .mutate(combineFunctions(initializers))
      .asImmutable();
  }

  // -- Mutability Controls --


  /** @private */
  isMutable() {
    return this.state.isMutable;
  }

  /**
   * @method Chain#asMutable
   * @summary
   *
   * Create a mutable copy of this instance.
   *
   * @description
   *
   * Calling {@link setState} usually returns new instance of `Chain`.
   * A mutable `Chain` instance can be modified in place without
   * creating copies.
   *
   * Prefer to call {@link mutate} to prevent leaking state.
   *
   * @see Chain#asImmutable
   * @see Chain#mutate
   *
   * @returns {Chain} Mutable copy of this instance.
   */
  asMutable() {
    return this.setState({ isMutable: true });
  }

  /**
   * @summary Prevent this instance from being mutated further.
   *
   * Call to seal an {@link Chain} after having called
   * {@link asMutable}.
   *
   * @returns {Chain} This instance.
   */
  asImmutable() {
    return this.setState({ isMutable: false });
  }

  /**
   * @method Chain#mutate
   * @summary
   *
   * Create a mutated copy of this instance.
   *
   * @example <caption>Using a callback initializer</caption>
   *
   * AustralianWomen = People.mutate(People => {
   *  People
   *    .where({ country: 'Australia', gender: 'female' });
   *    .with('spouse', 'children', 'jobs')
   * });
   *
   * @param {initialize} initializer
   *  An initializer callback, taking the Chain instance as its first
   *  argument. Alternatively an object of {[method]: argument} pairs to be
   *  invoked.
   *
   * @returns {Chain}
   *   Mutated copy of this instance.
   */
  mutate(initialize) {

    if (!isFunction(initialize)) {
      return this;
    }

    const wasMutable = this.isMutable();
    const instance = this.asMutable();

    /**
     * @summary Callback to be passed to {@link mutate}.
     *
     * The function receives a mutable copy of this instance. Any calls to
     * {@link setState} will not cause copies to be made.
     *
     * @this {Chain}
     *   The instance to mutate.
     * @param {Chain} instance
     *   The instance to mutate.
     * @function initialize
     */
    initialize.call(instance, instance);

    return wasMutable ? instance : instance.asImmutable();
  }
}

export default Chain;
