import { identity } from 'lodash/utility';
import { mapKeys } from 'lodash/object';

const methods = {

  /** @protected */
  columnToAttribute: identity,

  /** @protected */
  attributeToColumn: identity,

  /** @protected */
  columnsToAttributes: identity,

  /** @protected */
  attributesToColumns: identity,

  /** @private */
  columnToTableColumn(column) {
    const table = this.getOption('table');
    return `${table}.${column}`;
  },

  /** @private */
  columnsToTableColumns(columns) {
    const table = this.getOption('table');
    return mapKeys(columns, (value, column) => `${table}.${column}`);
  },

  attributeToTableColumn(attribute) {
    return this.columnToTableColumn(this.attributeToColumn(attribute));
  },

  attributesToTableColumns(attributes) {
    return this.columnsToTableColumns(this.attributesToColumns(attributes));
  }

};

export default { methods };
