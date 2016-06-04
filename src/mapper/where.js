import { isArray, isObject, isString } from 'lodash';
import { isMapper } from './index';
import { isQueryBuilderSpecifyingColumns } from './helpers/knex';
import { keyValueToObject } from './../arguments';

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

    return this.withMutations(mapper => {

      let column = null;
      if (isString(attribute)) {
        if (args.length === 1) {
          // (string, mixed)
          mapper.strictAttribute(attribute, args[0]);
        } else if (args.length === 2 && args[0] === '=') {
          // (string, '=', mixed)
          mapper.strictAttribute(attribute, args[1]);
        }
        column = mapper.attributeToTableColumn(attribute);
      } else if (isArray(attribute)) {
        // (string[], mixed[])
        mapper.strictAttribute(attribute, args[0]);
        column = keyValueToObject(
          attribute.map(mapper.attributeToTableColumn.bind(mapper)),
          args[0]
        );
        args = [];
      } else if (isObject(attribute)) {
        // ({ [string]: mixed })
        mapper.strictAttributes(attribute);
        column = mapper.attributesToTableColumns(attribute);
      } else {
        // (function)
        column = attribute;
      }

      return mapper.query('where', column, ...args);
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

    const columns = isArray(attribute)
      ? attribute.map(attr => this.attributeToTableColumn(attr))
      : this.attributeToTableColumn(attribute);

    return this.query('whereIn', columns, values);
  }
};
