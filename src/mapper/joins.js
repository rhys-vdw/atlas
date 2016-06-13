import { flatten, uniq } from 'lodash';
import {
  assertKeysCompatible, ensureArray, keyValueToObject
} from '../arguments';
import { isQueryBuilderEmpty } from './helpers/knex';

export default {

  initialize() {
    this.setState({ omitPivot: false });
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
   * const BobsGroups = Users.relation('groups').of(bob).pivotAttributes('is_owner');
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
   *       `${r.name} spent ${r._pivot_total_cost} at ${r._pivot_created_at}`
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
      ...(this.state.pivotAttributes || []),
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
   * @return {Mapper}
   *   Mapper joined to Other.
   */
  join(
    Other,
    selfAttribute = this.getRelationAttribute(Other),
    otherAttribute = Other.getRelationAttribute(this)
  ) {

    assertKeysCompatible({ selfAttribute, otherAttribute });

    const previousJoins = this.state.joins || [];

    // Use a default alias if there's a name conflict.
    const previousName = Other.getName();
    Other = Other.setState({ name:
      previousName  === this.getName()
        ? `${previousName}_${previousJoins.length}`
        : previousName
    });

    // If the other query builder has some state, we must wrap it.
    const joinTable = isQueryBuilderEmpty(Other)
      ? Other.getAliasedTable()
      : Other.prepareFetch().toQueryBuilder().as(Other.getName());

    // Convert attributes to correct database identfiers.
    const selfColumns = ensureArray(selfAttribute)
      .map(a => this.attributeToTableColumn(a));

    const otherColumns = ensureArray(otherAttribute)
      .map(a => Other.attributeToTableColumn(a));

    const joinColumns = keyValueToObject(selfColumns, otherColumns);

    return this.mutate(mapper => {
      mapper.query('join', joinTable, joinColumns);
      mapper.setState({
        joins: [ ...previousJoins, Other ]
      });
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
   * @todo remove this entirely. relations are to become mappers.
   *
   * @param {String} relationName
   *   The name of the relation with which to perform an inner join.
   * @return {Mapper}
   *   Mapper joined to given relation.
   */
  joinRelation(relationName) {
    return this.join(this.relation(relationName));
  },

};
