import memoize from 'lodash/memoize';
import mapKeys from 'lodash/mapKeys';

function FormatAttributes({ attributeToColumn, columnToAttribute }) {

  return callSuper => ({

    attributeToColumn: memoize(function(attribute) {
      return attributeToColumn(
        callSuper(this, 'attributeToColumn', attribute)
      );
    }),

    columnToAttribute: memoize(function(column) {
      return columnToAttribute(
        callSuper(this, 'columnToAttribute', column)
      );
    }),

    columnsToAttributes(columns) {
      return mapKeys(columns, (value, column) =>
        this.columnToAttribute(column)
      );
    },

    attributesToColumns(attributes) {
      return mapKeys(attributes, (value, attribute) =>
        this.attributeToColumn(attribute)
      );
    }
  });
}

export default FormatAttributes;
