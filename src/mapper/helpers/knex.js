import { isEmpty, some, startsWith } from 'lodash';
import { isMapper } from '../index';

const handleMapper = fn => maybeMapper => {
  return isMapper(maybeMapper)
    ? fn(maybeMapper.state.queryBuilder)
    : fn(maybeMapper);
};

const hasGrouping = grouping => handleMapper(queryBuilder =>
  some(queryBuilder._statements, { grouping })
);

export const isQueryBuilderEmpty = handleMapper(queryBuilder =>
  isEmpty(queryBuilder._statements)
);

export const isQueryBuilderJoined = hasGrouping('join');
export const isQueryBuilderSpecifyingColumns = hasGrouping('columns');
export const isQueryBuilderOrdered = hasGrouping('order');

// 'column' -> true
// 'name.column' -> true
// 'other.column' -> false
//
const createIsOwnColumn = table => column => {
  const index = column.indexOf('.');
  return index === -1 || (
    index === table.length && startsWith(column, table)
  );
}

export const isQueryBuilderSpecifyingOwnColumns = handleMapper(queryBuilder => {
  if (queryBuilder._statements.length === 0) {
    return false;
  }
  const isOwnColumn = createIsOwnColumn(queryBuilder._single.table);
  return queryBuilder._statements.some(statement =>
    statement.grouping === 'columns' && statement.value.some(isOwnColumn)
  );
});
