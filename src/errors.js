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

export class NoopError extends AtlasError {
  constructor(Mapper, reason) {
    super(
      'NoopError',
      `reason: ${reason},
      mapper: ${Mapper}`
    );

    this.Mapper = Mapper;
    this.reason = reason;
  }
}

export class UnidentifiableRecordError extends AtlasError {
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

export class InvalidOptionError extends AtlasError {
  constructor(option, Mapper) {
    super(
      'InvalidOptionError',
      `Tried to retrieve unset option "${option}" on mapper:
      ${Mapper}`
    );

    this.option = option;
    this.Mapper = Mapper;
  }
}

export class NotFoundError extends AtlasError {
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

export class NoRowsFoundError extends AtlasError {
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

export class UnregisteredKeyError extends AtlasError {
  constructor(registry, key) {
    super(
      'UnregisteredKeyError',
      `Unknown registry key '${key}'`
    );

    this.registry = registry;
    this.key = key;
  }
}

export class RegisteredKeyError extends AtlasError {
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
