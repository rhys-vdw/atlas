import { RegisteredKeyError, UnregisteredKeyError } from './errors';

/**
 * @class
 * @classdesc
 *
 * A simple map for storing instances of {@link Mapper}. The registry can be
 * helped to break dependency cycles between mappers defined in different
 * scripts.
 *
 * Each {@link Atlas} instance has a {@link Atlas#registry registry property}.
 *
 * All manipulation of the registry can be done via the Atlas instance.
 *
 * @see {@link Atlas} instance for retrieving mappers.
 * @see {@link Atlas#registry} for an instance of `Registry`.
 * @see {@link Atlas#register} to add mappers.
 * @see {@link Atlas#override} to override previously registered mappers.
 */
class Registry {

  /** @private */
  constructor(registry = {}) {
    this._registry = { ...registry };
  }

  /** @private */
  register(key, instance) {
    const registry = this._registry;
    if (key in registry) {
      throw new RegisteredKeyError(this, key);
    }
    return registry[key] = instance;
  }

  /** @private */
  override(key, instance) {
    const registry = this._registry;
    if (!(key in registry)) {
      throw new UnregisteredKeyError(this, key);
    }
    return registry[key] = instance;
  }

  /** @private */
  retrieve(key) {
    const registry = this._registry;
    if (!(key in registry)) {
      throw new UnregisteredKeyError(this, key);
    }
    return registry[key];
  }
}

export default Registry;
