import isEmpty from 'lodash/lang/isEmpty';
import { isMapper } from '../index';

export function isQueryBuilderEmpty(queryBuilder) {
  return isMapper(queryBuilder)
    ? isEmpty(queryBuilder.state.queryBuilder._statements)
    : isEmpty(queryBuilder._statements);
}
