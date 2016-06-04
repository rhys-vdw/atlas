import { inspect } from 'util';
import { flatten, isFunction, isString } from 'lodash';

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

    const flattened = normalizeRelated(...related);

    if (flattened.length === 0) {
      return this;
    }

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

/**
 * Convenience function to help build {@link Related} instances.
 * Pass this instance to {@link Mapper#with} or {@link Mapper#load} to describe
 * an eager relation.
 *
 * These are equivalent:
 *
 * ```js
 * BooksWithCover = Books.with('coverImage');
 * BooksWithCover = Books.with(related('coverImage'));
 * ```
 *
 * But using the `related` wrapper allows chaining for more complex eager
 * loading behaviour:
 *
 * ```js
 * const { NotFoundError } = atlas.errors;
 *
 * Books.with(related('coverImage').require()).findBy('title', 'Dune')
 *   .then(book => renderThumbnail(book))
 *   .catch(NotFoundError, error => {
 *     console.error('Could not render thumbnail, no cover image!');
 *   });
 * ```
 *
 * Including nested loading:
 *
 * ```js
 * Authors.where({ surname: 'Herbert' }).with(
 *   related('books').with('coverImage', 'blurb')
 * ).fetch().then(authors => {
 *   res.html(authors.map(renderBibliography).join('<br>'))
 * })
 * ```
 *
 * @see Mapper#with
 * @see Mapper#load
 * @see Related#with
 *
 * @alias related
 * @param {string|Relation} relationName
 *   The name of a relation registered with {@link Mapper#relations} or a
 *   {@link Relation} instance.
 * @returns {Related}
 *   A {@link Related} instance.
 */
function toRelated(relationName) {

  // Normalize instances of `Relation`.
  if (isRelated(relationName)) {
    return relationName;
  }

  if (isString(relationName)) {
    return new Related().as(relationName);
  }

  // Any object with method `of` is considered to be a Relation instance.
  if (relationName && isFunction(relationName.of)) {
    return new Related().relation(relationName);
  }

  throw new TypeError(
    `Expected instance of string, Related or Relation, ` +
    `got ${inspect(relationName)}`
  );
}

/**
 * @private
 * @param {...(Related|string|Related[]|string[])} related
 *   One or more `Related` instances or relation names.
 * @returns {Related[]}
 *   Array or `Related` instances.
 */
export function normalizeRelated(...relatedList) {
  return flatten(relatedList).map(toRelated);
}


export { toRelated as related };

export default Related;
