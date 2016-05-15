import { inspect } from 'util';
import { flatten, map, reject, isEmpty, isString } from 'lodash';

import ImmutableBase from './immutable-base';
import { RELATED_SENTINEL } from './constants';

export function isRelated(maybeRelated) {
  return !!(maybeRelated && maybeRelated[RELATED_SENTINEL]);
}

/**
 * `Related` describes relations as passed to eager loader etc.
 */
class Related extends ImmutableBase {

  /** Raise an error if the relation is not found. */
  require() {
    return this.mapper({ require: true });
  }

  /**
   * Set the relation instance
   *
   * @param {Relation}
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
   * Users.with(related(posts)).fetch();
   *
   * @param {String} name
   *   The relation name. Used as a key when setting related records.
   * @returns {Related}
   *   Self, this method is chainable.
   */
  as(name) {
    return this.setState({ name });
  }

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
   * Soldier.with(
   *   related('superior').recursions(Infinity)
   * ).fetchAll().then(soldier => // ...
   *
   * @param {Number} recursions
   *   Either an integer or `Infinity`.
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

  getNextRecursion() {
    const { recursions } = this.state;
    return recursions
      ? this.recursions(recursions - 1)
      : null;
  }

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

  getRelated() {
    const { related = [] } = this.state;
    const recursion = this.getNextRecursion();
    return recursion == null ? related : [ ...related, recursion ];
  }

  mapper(...initializers) {
    const previous = this.state.initializers || [];
    return this.setState({
      initializers: [ ...previous, ...initializers ]
    });
  }

  getRelation(Self) {
    return this.state.relation || Self.getRelation(this.name());
  }

  mapRelated(Self, ...args) {
    return this.getRelation(Self).mapRelated(...args);
  }

  /**
   * Create a {@link Mapper} representing records described by this `Related`.
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

export function related(...relations) {
  const flattened = flatten(relations);
  return flattened.length === 1
    ? create(flattened[0])
    : map(flattened, create);
}

export default Related;
