import { map } from 'lodash';
import { isMapper } from '../mapper';

function formatPivot(...tables) {
  return tables.sort().join('_');
}

export function pivot(...mappersOrTables) {
  return formatPivot(...map(mappersOrTables, table =>
    isMapper(table) ? table.requireState('table') : table
  ));
}
