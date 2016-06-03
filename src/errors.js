function AtlasError(name, message) {
  this.name = name;
  this.message = message;
  Error.captureStackTrace(this, AtlasError);
}

AtlasError.prototype = Object.create(Error.prototype);
AtlasError.prototype.constructor = AtlasError;
AtlasError.prototype.toString = function() {
  return `${this.name}: ${this.message}`;
};

/**
 * Can be accessed via {@link Atlas.errors} or imported directly.
 *
 * ```js
 * const { NotFoundError } = Atlas.errors;
 * ```
 *
 * ```js
 * import { NotFoundError } from 'atlas/errors';
 * ```
 *
 * @namespace errors
 */

/**
 * @class
 * @memberof errors
 * @classdesc
 *
 * Record could not be identified.
 *
 * ```js
 * Users.update({ name: 'Bob' })
 * // ERROR: Expected record to have ID attribute 'id'!
 * ```
 */
class UnidentifiableRecordError extends AtlasError {
  constructor(Mapper, record, idAttribute) {
    super(
      'UnidentifiableRecordError',
      `Expected record '${JSON.stringify(record)}' to have ID attribute(s) ` +
      `'${idAttribute}', mapper:
      ${Mapper}`
    );

    this.Mapper = Mapper;
    this.record = record;
    this.idAttribute = idAttribute;
  }
}

/**
 * @class
 * @memberof errors
 * @classdesc
 *
 * Unset state was required, but had not been set.
 *
 * ```js
 * Mapper.save({ name: 'Bob' });
 * // ERROR: Tried to retrieve unset state 'table'!
 * ```
 *
 * @see ImmutableBase#requireState
 */
class UnsetStateError extends AtlasError {
  constructor(key, Mapper) {
    super(
      'UnsetStateError',
      `Tried to retrieve unset state key "${key}" on mapper:
      ${Mapper}`
    );

    this.key = key;
    this.Mapper = Mapper;
  }
}

/**
 * @class
 * @memberof errors
 * @classdesc
 *
 * A specific record was not found.
 *
 * ```js
 * Users.require().find(999).then(...).catch(error => {
 *   console.log(error);
 *   // ERROR: No row found!
 * });
 * ```
 *
 * @see Mapper#require
 */
class NotFoundError extends AtlasError {
  constructor(Mapper, queryBuilder, method) {
    super(
      'NotFoundError',
      `No row found when calling '${method}' on mapper:
      ${Mapper}`
    );

    this.Mapper = Mapper;
    this.queryBuilder = queryBuilder;
  }
}

/**
 * @class
 * @memberof errors
 * @classdesc
 *
 * No records returned.
 *
 * ```js
 * Mapper.require().fetch().then(...).catch(error => {
 *   console.log(error);
 *   // ERROR: No rows found!
 * });
 * ```
 *
 * @see Mapper#require
 */
class NoRowsFoundError extends AtlasError {
  constructor(Mapper, queryBuilder, method) {
    super(
      'NoRowsFoundError',
      `Failed to find any records when calling '${method}' on mapper:
      ${Mapper}`
    );

    this.Mapper = Mapper;
    this.queryBuilder = queryBuilder;
  }
}

/**
 * @class
 * @memberof errors
 * @classdesc
 *
 * A {@link Mapper} was not found.
 *
 * ```js
 * atlas.register('Users', Mapper.table('users'));
 * atlas('Useers').fetch()
 * // ERROR: Unknown registry key 'Useers'!
 * ```
 *
 */
class UnregisteredKeyError extends AtlasError {
  constructor(registry, key) {
    super(
      'UnregisteredKeyError',
      `Unknown registry key '${key}'`
    );

    this.registry = registry;
    this.key = key;
  }
}

/**
 * @class
 * @memberof errors
 * @classdesc
 *
 * A {@link Mapper} was found at this registry key.
 *
 * ```js
 * atlas.register('Mapper', Mapper.table('users'));
 * // ERROR: 'Mapper' already registered!
 * ```
 *
 */
class RegisteredKeyError extends AtlasError {
  constructor(registry, key) {
    super(
      'RegisteredKeyError',
      `Key '${key}' is already registered. Use 'Registry#override' to ` +
      `override this item.`
    );

    this.registry = registry;
    this.key = key;
  }
}

export {
  UnidentifiableRecordError,
  UnsetStateError,
  NotFoundError,
  NoRowsFoundError,
  UnregisteredKeyError,
  RegisteredKeyError
};
