class AtlasError extends Error {
  constructor(name, message) {
    super(message);
    this.name = name
    this.message = message;

    const temp = new Error()
    temp.name = name
    this._stack = temp.stack;
  }

  get stack() {
    return this._stack;
  }

  toString() {
    return `${this.name}: ${this.message}`
  }
}

export class UnidentifiableRecordError extends AtlasError {
  constructor(Mapper, record, idAttribute) {
    super(
      'UnidentifiableRecordError',
      `Expected record '${JSON.stringify(record)}' to have ID key(s) '${idAttribute}', mapper:'
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
      `Failed to find any records when calling '${method}' on mapper:
      ${Mapper}`
    );

    this.Mapper = Mapper;
    this.queryBuilder = queryBuilder;
  }
}
