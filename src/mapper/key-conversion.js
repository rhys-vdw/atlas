import identity from 'lodash/identity';
import mapKeys from 'lodash/mapKeys';

export default {

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
    const table = this.requireState('table');
    return `${table}.${column}`;
  },

  /** @private */
  columnsToTableColumns(columns) {
    const table = this.requireState('table');
    return mapKeys(columns, (value, column) => `${table}.${column}`);
  },

  attributeToTableColumn(attribute) {
    return this.columnToTableColumn(this.attributeToColumn(attribute));
  },

  attributesToTableColumns(attributes) {
    return this.columnsToTableColumns(this.attributesToColumns(attributes));
  }

};
