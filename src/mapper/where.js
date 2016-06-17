import { isArray, isObject, isString, zipObject } from 'lodash';
import { isMapper } from './index';
import { isQueryBuilderSpecifyingColumns } from './helpers/knex';
import { ensureArray, flattenPairs, keyValueToObject } from './../arguments';

export default {

  /**
   * @method Mapper#where
   * @summary
   *
   * Select a subset of records.
   *
   * @description
   *
   * Passthrough to [`QueryBuilder#where`](http://knexjs.org/#Builder-where)
   * with some extra features.
   *
   * ```js
   * const People = Mapper.table('people');
   * People.where({ name: 'Rhys' }).fetch().then(people => // ...
   * ```
   *
   * Mapper respects {@link Mapper#attributeToColumn} if overridden.
   *
   * ```js
   * const { CamelCase }
   * const Monsters = Mapper.extend(CamelCase()).table('monsters');
   * const ScaryMonsters = Monsters.where({ eyeColor: 'red', clawSize: 'large' });
   *
   * ScaryMonsters.count().then(count => {
   *   if (count > 0) {
   *     runAway();
   *   }
   * });
   * ```
   *
   * ```sql
   * select count(*) from monsters
   * where eye_color = 'red' and claw_size = 'large'
   * ```
   *
   * Also overrides attributes (by calling {@link strictAttributes} internally).
   *
   * ```js
   * const Deleted = Users.where('is_deleted', true);
   * const tas = Deleted.forge({ name: 'Tas' });
   * // tas -> { name: 'Tas', is_deleted: true }
   *
   * Deleted.save({ id: 5, is_deleted: false }).then(deleted => {
   *   // deleted -> { id: 5, is_deleted: true }
   * });
   * ```
   *
   * Also allows an operator (see Knex docs for more into):
   *
   * ```js
   * const MultiHeaded = Monsters.where('headCount', '>', 1);
   * const Living = Monsters.where('isDead', '!=', 1);
   * ```
   *
   * And handles arrays (useful for composite keys):
   *
   * ```js
   * Mapper.table('monster_kills')
   *   .where(['monster_id', 'victim_id'], [spider.id, fred.id])
   *   .count(killCount => {
   *     console.log(
   *       `Fred was ${killCount == 0 ? 'not ' : ''} killed by a spider!`
   *     );
   *   });
   * ```
   *
   * @param {string|string[]|Object} attribute
   *   Attribute name(s) or object of values keyed by attribute name.
   * @param {...mixed} args
   *   See description.
   * @returns {Mapper}
   */
  where(attribute, ...args) {
    return this.mutate(mapper => {

      if (args.length === 0) {
        if (!isObject(attribute)) throw new TypeError(
          'Unexpected `where` arguments'
        );
        // ({ [string]: mixed })
        mapper.strictAttributes(attribute);
        mapper.query('where', mapper.attributesToTableColumns(attribute));
        return;
      }

      if (isString(attribute)) {

        if (args.length === 1) {
          // (attribute, value)
          mapper.strictAttribute(attribute, args[0]);
        } else if (args[0] === '=') {
          // (attribute, operator, value)
          mapper.strictAttribute(attribute, args[1]);
        }

        mapper.query(
          'where', mapper.attributeToTableColumn(attribute), ...args
        );
        return;
      }

      if (isArray(attribute)) {
        // (string[], mixed[])
        mapper.strictAttribute(attribute, args[0]);
        const columns = keyValueToObject(
          attribute.map(mapper.attributeToTableColumn.bind(mapper)),
          args[0]
        );

        mapper.query('where', columns);
        return;
      }

      // ({ [table]: column }, value)
      if (isObject(attribute)) {
        if (args.length > 1) throw new TypeError(
          'NYI - nested attribute with operator'
        );
        const columns = flattenPairs(attribute).map(([table, attr]) =>
          // TODO: Use proper `attributeToColumn` from join table.
          `${table}.${mapper.attributeToColumn(attr)}`
        );

        const values = ensureArray(args[0]);
        mapper.query('where', zipObject(columns, values));
        return;
      }

      throw new TypeError('Unexpected arguments');
    });
  },

  /** @private */
  whereInMapper(attribute, Other) {
    if (!isQueryBuilderSpecifyingColumns(Other)) {
      Other = Other.attributes(attribute);
    }
    const inner = Other.prepareFetch().toQueryBuilder();
    return this._whereIn(attribute, inner);
  },

  /**
   * Passthrough to [`QueryBuilder#whereIn`](http://knexjs.org/#Builder-whereIn)
   * that respects {@link Mapper#attributeToColumn} if overridden.
   *
   * @method Mapper#whereIn
   * @returns {Mapper}
   */
  whereIn(attribute, values) {
    return isMapper(values)
      ? this.whereInMapper(...arguments)
      : this._whereIn(...arguments);
  },

  /** @private */
  _whereIn(attribute, values) {

    let column = null;

    if (isArray(attribute)) {
      column = attribute.map(attr => this.attributeToTableColumn(attr));
    } else if (isObject(attribute)) {
      const columns = flattenPairs(attribute).map(([table, attr]) =>
        // TODO: Use proper `attributeToColumn` from join table.
        `${table}.${this.attributeToColumn(attr)}`
      );

      column = columns.length === 1 ? columns[0] : columns;
    } else {
      column = this.attributeToTableColumn(attribute);
    }

    return this.query('whereIn', column, values);
  }
};
