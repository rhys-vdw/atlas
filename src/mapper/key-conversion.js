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
    const alias = this.getName();
    return `${alias}.${column}`;
  },

  /** @private */
  columnsToTableColumns(columns) {
    const alias = this.getName();
    return mapKeys(columns, (value, column) => `${alias}.${column}`);
  },

  /** @private */
  attributeToTableColumn(attribute) {
    return this.columnToTableColumn(this.attributeToColumn(attribute));
  },

  /** @private */
  attributesToTableColumns(attributes) {
    return this.columnsToTableColumns(this.attributesToColumns(attributes));
  },

  /** @private */
  attributeToAliasedColumn(name, attribute) {
    const column = this.attributeToColumn(attribute);
    return `${name}.${column} as _${name}_${column}`;
  },
};
