import camelCase from 'lodash/string/camelCase';
import snakeCase from 'lodash/string/snakeCase';

export default function CamelCase() {
  return {
    attributeToColumn: snakeCase,
    columnToAttribute: camelCase
  };
}
