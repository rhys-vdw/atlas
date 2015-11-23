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

    const simpleJoin = isQueryBuilderEmpty(Other);

    const table = simpleJoin
      ? Other.getOption('table')
      : Other.prepareFetch().toQueryBuilder().as(PIVOT_ALIAS);

    const otherAttributeToTableColumn = simpleJoin
      ? Other.attributeToTableColumn
      : key => `${PIVOT_ALIAS}.${Other.attributeToColumn(key)}`;

    const joinColumns = zipObject(
      map(selfKeys, this.attributeToTableColumn, this),
      map(otherKeys, otherAttributeToTableColumn, Other)
    );

    return this.withMutations(mapper => {
      if (!simpleJoin) {
        mapper.setOption('pivotAlias', PIVOT_ALIAS);
      }
      mapper.query('join', table, joinColumns);
    });
  },

  joinRelated(relationName) {
    const relation = this.getRelation(relationName);
    const selfAttribute = relation.selfKey || relation.selfRef;
    const otherAttribute = relation.otherKey || relation.otherRef;
    const { Other } = relation;

    return this.withMutations(mapper =>
      mapper
        .setOption('pivotRelationName', relationName)
        .joinMapper(Other, selfAttribute, otherAttribute)
    );
  },

};

export default { methods, options };
