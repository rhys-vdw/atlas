import isEmpty from 'lodash/isEmpty';
import some from 'lodash/some';
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
