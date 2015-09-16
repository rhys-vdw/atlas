class AtlasError extends Error {
  constructor(name, message) {
    super(message);
    this.name = name
    this.message = message;
  }

  toString() {
    return `${this.name}: ${this.message}`
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
