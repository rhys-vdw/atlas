import { map } from 'lodash/collection';
import { isMapper } from '../mapper';

function formatPivot(...tables) {
  return tables.sort().join('_');
}

export function pivot(...mappersOrTables) {
  return formatPivot(...map(mappersOrTables, table =>
    isMapper(table) ? table.getOption('table') : table
  ));
}