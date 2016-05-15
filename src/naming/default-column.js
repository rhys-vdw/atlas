import { singularize } from 'inflection';
import { map, isArray } from 'lodash';

function singleTableColumnRef(table, column) {
  return `${singularize(table)}_${column}`;
}

export function tableColumnRef(table, column) {
  return isArray(column)
    ? map(column, c => singleTableColumnRef(table, c))
    : singleTableColumnRef(table, column);
}

export function mapperColumnRef(Mapper, column) {
  const table = Mapper.requireState('table');
  return tableColumnRef(table, column);
}

export function mapperAttributeRef(Mapper, attribute) {
  const table = Mapper.requireState('table');
  const column = isArray(attribute)
    ? map(attribute, Mapper.attributeToColumn, Mapper)
    : Mapper.attributeToColumn(attribute);
  return tableColumnRef(table, column);
}
