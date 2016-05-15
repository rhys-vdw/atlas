import camelCase from 'lodash/camelCase';
import snakeCase from 'lodash/snakeCase';

export default function CamelCase() {
  return {
    attributeToColumn: snakeCase,
    columnToAttribute: camelCase
  };
}
