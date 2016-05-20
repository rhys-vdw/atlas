import camelCase from 'lodash/camelCase';
import snakeCase from 'lodash/snakeCase';
import FormatAttributes from './FormatAttributes';

export default function CamelCase() {
  return FormatAttributes({
    attributeToColumn: snakeCase,
    columnToAttribute: camelCase
  });
}
