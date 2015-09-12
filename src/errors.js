export class InvalidOptionError extends Error {
  constructor(option, Mapper) {
    super(
      `Tried to retrieve unset option "${option}" on mapper:
      ${Mapper}`
    );

    this.option = option;
    this.Mapper = Mapper;
  }
}
