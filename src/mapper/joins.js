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

  /**
   * @method Mapper#omitPivot
   * @summary
   *
   * Exclude columns from a joined table.
   *
   * @description
   *
   * Columns from a joined table can be added to a {@link Mapper#fetch fetch}
   * query with {@link Mapper#pivotAttributes}. This chaining this method
   * will prevent them from appearing in the returned record(s).
   *
   * In a ({@link Mapper#belongsToMany many-to-many relation}), key columns
   * from the join table are included automatically.  These are necessary to
   * associate the related records to their parents in an eager load.
   *
   * @example
   *
   * const bob = { id: 1, name: 'Bob' };
   * const BobsGroups = Users.getRelation('groups').of(bob).pivotAttributes('is_owner');
   *
   * BobsGroups.fetch().then(groups => {
   *   console.log(groups);
   *   // [{ _pivot_user_id: 1, _pivot_is_owner: false, id: 10, name: 'General' },
   *   // { _pivot_user_id: 1, _pivot_is_owner: true, id: 11, name: 'Database' }]
   * });
   *
   * BobsGroups.omitPivot().fetch().then(groups => {
   *   console.log(groups);
   *   // [{ id: 10, name: 'General' }, { id: 11, name: 'Database' }]
   * });
   *
   * @see Mapper#pivotAttributes
   * @returns {Mapper}
   *   Mapper that will not return pivot attributes in a fetch response.
   */
  omitPivot() {
    return this.setState({ omitPivot: true });
  },

  /**
   * @method Mapper#pivotAttributes
   * @summary
   *
   * Fetch columns from a joined table.
   *
   * @description
   *
   * Include columns from a table that has been joined with
   * {@link Mapper#joinRelation joinRelation} or
   * {@link Mapper#joinMapper joinMapper}.
   *
   * @example
   *
   * Customers
   *   .joinMapper(Receipts, 'id', 'customer_id')
   *   .pivotAttributes({ 'created_at', 'total_cost' })
   *   .where('receipts.created_at', >, yesterday)
   *   .then(receipts => {
   *     console.log('Purchases today: \n' + receipts.map(r =>
   *       `${r.name} spent $${r._pivot_total_cost} at ${r._pivot_created_at}`
   *     ));
   *   });
   *
   * @see Mapper#omitPivot
   * @param {...string|string[]} attributes
   *   Attributes to be included from joined table.
   * @returns {Mapper}
   *   Mapper that will return pivot attributes in a fetch response.
   */
  pivotAttributes(...attributes) {
    const pivotAttributes = uniq([
      ...this.state.pivotAttributes,
      ...flatten(attributes)
    ]);
    return this.setState({ pivotAttributes });
  },

  /**
   * @method Mapper#joinMapper
   * @summary
   *
   * Join query with another `Mapper`.
   *
   * @description
   *
   * Performs an `inner join` between the {@link Mapper#table table} of this
   * `Mapper` and that of `Other`.
   *
   * @param {Mapper} Other
   *   Mapper with query to join.
   * @param {string|string[]} selfAttribute
   *   The attribute(s) on this Mapper to join on.
   * @param {string|string[]} otherAttribute
   *   The attribute(s) on Other to join on.
   * @return {Mapper}
   *   Mapper joined to Other.
   */
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

  /**
   * @method Mapper#joinRelation
   * @summary
   *
   * Join query with a related `Mapper`.
   *
   * @description
   *
   * Performs an inner join between the {@link Mapper#table table} of this
   * `Mapper`, and that of the named {@link Mapper#relations relation}.
   *
   * @param {String} relationName
   *   The name of the relation with which to perform an inner join.
   * @return {Mapper}
   *   Mapper joined to given relation.
   */
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
