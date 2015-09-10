import { RELATION_TREE_SENTINEL } from './constants';
import _, { isEmpty, isArray, isObject, isString, merge, extend } from 'lodash';

// This is just here for debugging. Should be removed.
function logObject(...objects) {
  console.log(
    ...objects.map((object) =>
      isObject(object) ? require('util').inspect(object, { depth: 10 }) : object
    )
  );
}


/**
 * @function isRelationTree
 * @memberOf RelationTree
 * @static
 *
 * @param {mixed} maybeRelationTree
 *   Value to check.
 * @returns {bool}
 *   `true` if instance of {@link RelationTree}, otherwise `false`.
 */
export function isRelationTree(maybeRelationTree) {
  return !!(maybeRelationTree && maybeRelationTree[RELATION_TREE_SENTINEL]);
}

/**
 * @function fromString
 * @memberOf RelationTree
 * @static
 *
 * @param {string} string
 *   Relation DSL string.
 * @param {Object|function} initializer
 *   Initializer for the deepest child specified in the relation.
 * @returns {RelationTree}
 *   Compiled {@link RelationTree} instance.
 */
export function fromString(string, initializer) {
  if (!isString(string)) {
    throw new TypeError(`Expected 'string' to be string, got '${string}'`);
  }

  const list = _(string).split('.');
  const leaf = nodeFromString(list.last(), { initializer });

  return list.reverse().rest().reduce((nested, relation) =>
    nodeFromString(relation, { nested })
  , leaf);
}

/**
 * @function normalize
 * @memberOf RelationTree
 * @static
 *
 * @param {...(RelationTree|string|Array|Object)} relations
 *   Various relation definitions to be normalized.
 * @returns {RelationTree}
 *   A `RelationTree` instance composed of all given relations.
 */
export function normalize(...relations) {

  return _(relations).map((relation) => {

    if (isRelationTree(relation)) {
      return relation;
    }
    if (isString(relation)) {
      return fromString(relation);
    }
    if (isArray(relation)) {
      return normalize(...relation);
    }
    if (isObject(relation)) {
      return _.map(relation, (initializer, name) =>
        fromString(name, initializer)
      );
    }

    return [];

  }).flatten().reduce(mergeTrees, new RelationTree());

}

/**
 * @class RelationTree
 */
export default class RelationTree {
  constructor(properties) {
    extend(this, properties);
  }
  
  get [RELATION_TREE_SENTINEL]() { return true; }
}

RelationTree.isRelationTree = isRelationTree;
RelationTree.fromString = fromString;


// -- Private helpers --

function mergeCustomizer(a, b) {
  if (isRelationTree(a) || isRelationTree(b)) {
    return merge(a, b);
  }
}

function mergeTrees(a, b) {
  return merge(a, b, mergeCustomizer);
}

function nodeFromString(string, properties) {
  const [name, recursionsString] = string.split('^');
  let recursions;

  if (recursionsString != null) {
    recursions = isEmpty(recursionsString) ? 1 : +recursionsString;
  }

  return new RelationTree({ [name]: { recursions, ...properties } });
}
