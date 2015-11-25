import { assertKeysCompatible, ensureArray } from '../arguments';
import { flatten, uniq, zipObject } from 'lodash/array';
import { map } from 'lodash/collection';

import { isQueryBuilderEmpty } from './helpers/knex';
import { PIVOT_ALIAS } from '../constants';

const options = {
  omitPivot: false,
  pivotAlias: null,
  pivotAttributes: [],
  pivotRelationName: null,
};

const methods = {
  omitPivot() {
    return this.setOption('omitPivot', true);
  },

  pivotAttributes(...attributes) {
    return this.updateOption('pivotAttributes', previous =>
      uniq([...previous, ...flatten(attributes)])
    );
  },

  joinMapper(Other, selfAttribute, otherAttribute) {
    assertKeysCompatible({ selfAttribute, otherAttribute });

    const selfKeys = ensureArray(selfAttribute);
    const otherKeys = ensureArray(otherAttribute);

    let joinTable = null;
    let pivotAlias = null;

    if (isQueryBuilderEmpty(Other)) {

      const selfTable = this.getOption('table');
      const otherTable = Other.getOption('table');

      if (selfTable === otherTable) {
        pivotAlias = PIVOT_ALIAS;
        joinTable = `${otherTable} as ${pivotAlias}`;
      } else {
        pivotAlias = otherTable;
        joinTable = otherTable;
      }
    } else {
      pivotAlias = PIVOT_ALIAS;
      joinTable = Other.prepareFetch().toQueryBuilder().as(pivotAlias);
    }

    const otherAttributeToTableColumn = attribute =>
      `${pivotAlias}.${Other.attributeToColumn(attribute)}`;

    const joinColumns = zipObject(
      map(selfKeys, this.attributeToTableColumn, this),
      map(otherKeys, otherAttributeToTableColumn, Other)
    );

    return this.withMutations(mapper => {
      mapper.setOption('pivotAlias', pivotAlias);
      mapper.query('join', joinTable, joinColumns);
    });
  },

  joinRelation(relationName) {
    const relation = this.getRelation(relationName);
    const { selfAttribute, otherAttribute, Other } = relation;

    return this.withMutations(mapper =>
      mapper
        .setOption('pivotRelationName', relationName)
        .joinMapper(Other, selfAttribute, otherAttribute)
    );
  },

};

export default { methods, options };
