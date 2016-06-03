import { inspect } from 'util';
import { flatten, map, reject, isEmpty, isString } from 'lodash';

import ImmutableBase from './immutable-base';
import { RELATED_SENTINEL } from './constants';

export function isRelated(maybeRelated) {
  return !!(maybeRelated && maybeRelated[RELATED_SENTINEL]);
}

/**
 * `Related` is a helper to describe relation trees. Instances are passed to
 * `Mapper.with` and `Mapper.load` for eager loading.
 *
 * @extends ImmutableBase
 */
class Related extends ImmutableBase {

  /**
   * Raise an error if the relation is not found. Currently this is just a
   * passthrough to `Mapper.require()`.
   *
   * @returns {Related} Self, this method is chainable.
   *   Instance that will throw if no records are returned.
   */
  require() {
    return this.mapper({ require: true });
  }

  /**
   * Set the relation instance
   *
   * @private
   * @param {Relation} relation
   *   Relation instance.
   */
  relation(relation) {
    return this.setState({ relation });
  }

  /**
   * Set the name of the relation. Required if constructed with a
   * {@link Relation} instance, or can be used to alias a relation.
   *
   * @example
   *
   * // Use `name` to alias the `posts` relation.
   *
   * const lastWeek = moment().subtract(1, 'week');
   * const recentPosts = related('posts')
   *   .mapper({ where: ['created_at', '>', lastWeek] })
   *   .as('recentPosts');
   *
   * Users.with(recentPosts).findBy('name', 'Joe Bloggs').then(joe => // ...
   *
   * @example
   *
   * // Use `name` to provide a relation instance directly.
   *
   * const posts = hasMany('Post');
   * Users.with(related(posts).as('posts')).fetch();
   *
   * @param {String} name
   *   The relation name. Used as a key when setting related records.
   * @returns {Related}
   *   Self, this method is chainable.
   */
  as(name) {
    return this.setState({ name });
  }

  /** @private */
  name() {
    return this.requireState('name');
  }

  /**
   * Set the number of recursions.
   *
   * @example
   *
   * Person.with(
   *   related('father').recursions(3)
   * ).findBy('name', 'Kim Jong-un').then(person =>
   *  // person = {
   *  //   id: 4,
   *  //   name: 'Kim Jong-un',
   *  //   father_id: 3,
   *  //   father: {
   *  //     id: 3,
   *  //     name: 'Kim Jong-il',
   *  //     father_id: 2,
   *  //     father: {
   *  //       id: 2,
   *  //       name: 'Kim Il-sung',
   *  //       father_id: 1,
   *  //       father: {
   *  //         id: 1,
   *  //         name: 'Kim Hyong-jik',
   *  //         father_id: null
   *  //       }
   *  //     }
   *  //   }
   *  // }
   * )
   *
   * @example
   *
   * knex('nodes').insert([
   *   { id: 1, value: 'a', next_id: 2 },
   *   { id: 2, value: 't', next_id: 3 },
   *   { id: 3, value: 'l', next_id: 4 },
   *   { id: 4, value: 'a', next_id: 5 },
   *   { id: 5, value: 's', next_id: 6 },
   *   { id: 6, value: '.', next_id: 7 },
   *   { id: 7, value: 'j', next_id: 8 },
   *   { id: 8, value: 's', next_id: null }
   * ])
   *
   * atlas.register({
   *   Nodes: Mapper.table('nodes').relations({
   *     next: m => m.belongsTo('Nodes', { selfRef: 'next_id' })
   *   })
   * });
   *
   * // Fetch nodes recursively.
   * atlas('Nodes').with(
   *   related('next').recursions(Infinity)).find(1)
   * ).then(node =>
   *   const values = [];
   *   while (node.next != null) {
   *     letters.push(node.value);
   *     node = node.next;
   *   }
   *   console.log(values.join('')); // "atlas.js"
   * );
   *
   * @param {Number} recursions
   *   Either an integer or `Infinity`.
   * @returns {Related}
   *   Self, this method is chainable.
   */
  recursions(recursions) {
    if (recursions !== Math.round(recursions) || recursions < 0) {
      throw new TypeError(
        `'recursions' must be a positive integer or 'Infinity', ` +
        `got: ${recursions}`
      );
    }

    // It's important to create the nested relation in `getNextRecursion`. To
    // do it here would create a loop that expands the entire recusion path of
    // the relation tree. This would cause an endless loop when
    // `recusions === Infinity`.
    return this.setState({ recursions });
  }

  /** @private */
  getNextRecursion() {
    const { recursions } = this.state;
    return recursions
      ? this.recursions(recursions - 1)
      : null;
  }

  /**
   * Fetch nested relations.
   *
   * @example
   *
   * atlas('Actors').with(
   *   related('movies').with(related('director', 'cast'))
   * ).findBy('name', 'James Spader').then(actor =>
   *   assert.deepEqual(
   *     actor,
   *     { id: 2, name: 'James Spader', movies: [
   *       { _pivot_actor_id: 2, id: 3, title: 'Stargate', director_id: 2,
   *         director: { id: 2, name: 'Roland Emmerich' },
   *         cast: [
   *           { id: 2, name: 'James Spader' },
   *           // ...
   *         ]
   *       },
   *       // ...
   *     ]},
   *   )
   * );
   *
   * @param {...Related|Related[]} related
   *   One or more Related instances describing the nested relation tree.
   * @returns {Related}
   *   Self, this method is chainable.
   */
  with(...related) {
    const flattened = flatten(related);

    if (isEmpty(flattened)) {
      return this;
    }

    const invalid = reject(flattened, isRelated);
    if (!isEmpty(invalid)) throw new TypeError(
      `Expected instance(s) of Related, got: ${inspect(invalid)}`
    );

    const previous = this.state.related || [];

    return this.setState({
      related: [ ...previous, ...flattened ]
    });
  }

  /** @private */
  getRelated() {
    const { related = [] } = this.state;
    const recursion = this.getNextRecursion();
    return recursion == null ? related : [ ...related, recursion ];
  }

  /**
   * Queue up initializers for the `Mapper` instance used to query the relation.
   * Accepts the same arguments as `Mapper.withMutations`.
   *
   * ```js
   * Account.with(related('inboxMessages').mapper(m =>
   *   m.where({ unread: true })
   * )).fetch().then(account => // ...
   *
   * Account.with(
   *   related('inboxMessages').mapper({ where: { unread: true } })
   * ).fetch().then(account => // ...
   * ```
   *
   * @param {mixed} initializers
   *   Accepts the same arguments as
   *   {@link ImmutableBase#withMutations withMutations}.
   * @returns {Related}
   *   Self, this method is chainable.
   */
  mapper(...initializers) {
    const previous = this.state.initializers || [];
    return this.setState({
      initializers: [ ...previous, ...initializers ]
    });
  }

  /** @private */
  getRelation(Self) {
    return this.state.relation || Self.getRelation(this.name());
  }

  /** @private */
  mapRelated(Self, ...args) {
    return this.getRelation(Self).mapRelated(...args);
  }

  /**
   * Create a {@link Mapper} representing records described by this `Related`.
   * @private
   */
  toMapperOf(Self, ...ids) {
    const { initializers } = this.state;

    // Either get the stored relation, or get it by name from the "self"
    // mapper.

    return this.getRelation(Self).of(...ids).withMutations(initializers, {
      with: this.getRelated()
    });
  }
}

Related.prototype[RELATED_SENTINEL] = true;

function create(relation) {
  return isString(relation)
    ? new Related().as(relation)
    : new Related().relation(relation);
}

/**
 * Convenience function to help build {@link Related} instances.
 *
 * @example
 *
 * Book.where({ author: 'Frank Herbert' })
 *   .with(related('coverImage'))
 *   .fetch()
 *   .then(books => books.map(renderThumbnail));
 *
 * Book.with(
 *   related('chapters', 'coverImage').map(r => r.require())
 * ).findBy('isbn', '9780575035409').then(book =>
 *   renderBook(book)
 * );
 *
 * @static
 * @param {...string|Relation} relationName
 * @return {Related|Related[]}
 */
export function related(...relations) {
  const flattened = flatten(relations);
  return flattened.length === 1
    ? create(flattened[0])
    : map(flattened, create);
}

export default Related;
