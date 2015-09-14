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

export class NoRecordsFoundError extends AtlasError {
  constructor(Mapper) {
    super(
      `Failed to find any records when calling 'fetch()' on mapper:
      ${Mapper}`
    );

    this.Mapper = Mapper;
  }
}
