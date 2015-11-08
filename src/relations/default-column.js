import inflection from 'inflection';
import { map } from 'lodash/collection';
import { isArray } from 'lodash/lang';
const { singularize } = inflection;

function tableColumn(table, column) {
  return `${singularize(table)}_${column}`;
}

export function fromTableColumn(table, column) {
  return isArray(column)
    ? map(column, c => tableColumn(table, c))
    : tableColumn(table, column);
}

export function fromMapperColumn(Mapper, column) {
  const table = Mapper.getOption('table');
  return fromTableColumn(table, column);
}

export function fromMapperAttribute(Mapper, attribute) {
  const table = Mapper.getOption('table');
  const column = isArray(attribute)
    ? map(attribute, Mapper.attributeToColumn, Mapper)
    : Mapper.attributeToColumn(attribute);
  return fromTableColumn(table, column);
}
