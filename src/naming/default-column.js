import inflection from 'inflection';
import { map } from 'lodash/collection';
import { isArray } from 'lodash/lang';
const { singularize } = inflection;

function singleTableColumnRef(table, column) {
  return `${singularize(table)}_${column}`;
}

export function tableColumnRef(table, column) {
  return isArray(column)
    ? map(column, c => singleTableColumnRef(table, c))
    : singleTableColumnRef(table, column);
}

export function mapperColumnRef(Mapper, column) {
  const table = Mapper.getOption('table');
  return tableColumnRef(table, column);
}

export function mapperAttributeRef(Mapper, attribute) {
  const table = Mapper.getOption('table');
  const column = isArray(attribute)
    ? map(attribute, Mapper.attributeToColumn, Mapper)
    : Mapper.attributeToColumn(attribute);
  return tableColumnRef(table, column);
}
