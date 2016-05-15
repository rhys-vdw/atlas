import { assertKeysCompatible, ensureArray } from '../arguments';
import { flatten, uniq, zipObject, map } from 'lodash';
import { isQueryBuilderEmpty } from './helpers/knex';
import { PIVOT_ALIAS } from '../constants';

export default {

  initialize() {
    this.setState({
      omitPivot: false,
      pivotAlias: null,
      pivotAttributes: [],
      pivotRelationName: null,
    });
  },

  omitPivot() {
    return this.setState({ omitPivot: true });
  },

  pivotAttributes(...attributes) {
    const pivotAttributes = uniq([
      ...this.state.pivotAttributes,
      ...flatten(attributes)
    ]);
    return this.setState({ pivotAttributes });
  },

  joinMapper(Other, selfAttribute, otherAttribute) {
    assertKeysCompatible({ selfAttribute, otherAttribute });

    const selfKeys = ensureArray(selfAttribute);
    const otherKeys = ensureArray(otherAttribute);

    let joinTable = null;
    let pivotAlias = null;

    if (isQueryBuilderEmpty(Other)) {

      const selfTable = this.requireState('table');
      const otherTable = Other.requireState('table');

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

    const selfColumns = map(selfKeys, attribute =>
      this.attributeToTableColumn(attribute)
    );
    const otherColumns = map(otherKeys, attribute =>
      `${pivotAlias}.${Other.attributeToColumn(attribute)}`
    );
    const joinColumns = zipObject(selfColumns, otherColumns);

    return this.withMutations(mapper => {
      mapper.setState({ pivotAlias });
      mapper.query('join', joinTable, joinColumns);
    });
  },

  joinRelation(relationName) {
    const relation = this.getRelation(relationName);
    const { selfAttribute, otherAttribute, Other } = relation;

    return this.withMutations(mapper =>
      mapper
        .setState({ pivotRelationName: relationName })
        .joinMapper(Other, selfAttribute, otherAttribute)
    );
  },

};
