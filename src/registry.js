import { RegisteredKeyError, UnregisteredKeyError } from './errors';

export default class Registry {
  constructor(registry = {}) {
    this._registry = { ...registry };
  }

  register(key, instance) {
    const registry = this._registry;
    if (key in registry) {
      throw new RegisteredKeyError(this, key);
    }
    return registry[key] = instance;
  }

  override(key, instance) {
    const registry = this._registry;
    if (!(key in registry)) {
      throw new UnregisteredKeyError(this, key);
    }
    return registry[key] = instance;
  }

  retrieve(key) {
    const registry = this._registry;
    if (!(key in registry)) {
      throw new UnregisteredKeyError(this, key);
    }
    return registry[key];
  }
}
