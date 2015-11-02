import inflection from 'inflection';
const { singularize } = inflection;

export function fromTableColumn(table, column) {
  return `${singularize(table)}_${column}`;
}

export function fromMapperColumn(mapper, column) {
  const table = mapper.getOption('table');
  return fromTableColumn(table, column);
}

export function fromMapperAttribute(mapper, attribute) {
  const table = mapper.getOption('table');
  const column = mapper.attributeToColumn(attribute);
  return fromTableColumn(table, column);
}
