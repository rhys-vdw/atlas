import _ from 'lodash';
import { isArray, isEmpty, isObject, isString } from 'lodash/lang';
import { extend, merge } from 'lodash/object';
import { each, map } from 'lodash/collection';
import { flow } from 'lodash/function';

import { RELATION_TREE_SENTINEL } from './constants';
import { assertType } from './assertions';

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
 * @function mergeTrees
 * @memberOf RelationTree
 * @static
 *
 * @param {RelationTree} destination
 * @param {RelationTree} source
 */
export function mergeTrees(destination, source) {
  assertType({destination, source}, {RelationTree: isRelationTree});
  return merge(new RelationTree(), destination, source, mergeCustomizer);
}

/**
 * @function fromString
 * @memberOf RelationTree
 * @static
 *
 * @param {string} string
 *   Relation DSL string.
 * @param {Object|function} [initializer]
 *   Initializer for the deepest child specified in the relation.
 * @returns {RelationTree}
 *   Compiled {@link RelationTree} instance.
 */
export function fromString(string, initializer) {
  assertType({string}, {string: isString});

  const path = _(string).split('.');
  const leaf = nodeFromString(path.last(), initializer && { initializer });

  return path.reverse().rest().reduce((nested, relation) =>
    nodeFromString(relation, { nested })
  , leaf);
}

export function renestRecursives(relationTree) {
  assertType({relationTree}, {RelationTree: isRelationTree});

  each(relationTree, (node, relationName) => {
    const { recursions } = node;
    if (recursions > 0) {
      const nestedRecursions = recursions - 1;

      // See if recursion has already been renested. If it has, we don't need
      // to do it again.
      const existing = node.nested && node.nested[relationName];
      if (existing != null) {

        // Assert that the tree is valid. This should never be fired.
        if (existing.recursions !== nestedRecursions) throw new Error(
          `Invalid nesting of a recursive relation '${relationName}'`
        );

      } else {

        // Push recursive node down from root by inserting a copy in its place
        // and renesting it in with a decremented recursion count.
        //
        // TODO: this is broken. it will whipe out any relations that ought to
        // be attached to the node. eg. compile(`thing^3`, `thing.other`) -
        // other will be blown away on renesting.
        const nestedNode = { ...node, recursions: nestedRecursions };
        relationTree[relationName] = {
          recursions,
          nested: new RelationTree({
            [relationName]: nestedNode
          })
        };
      }
    }
  });

  return relationTree;
}

/**
 * @function compile
 * @memberOf RelationTree
 * @static
 *
 * @param {...(RelationTree|string|Array|Object)} relations
 *   Various relation definitions to be compiled.
 * @returns {RelationTree}
 *   A `RelationTree` instance compiled of all given relations.
 */
export function compile(...relations) {

  return _(relations).map(relation => {

    if (isRelationTree(relation)) {
      return relation;
    }
    if (isString(relation)) {
      return fromString(relation);
    }
    if (isArray(relation)) {
      return compile(...relation);
    }
    if (isObject(relation)) {
      return map(relation, (initializer, name) =>
        fromString(name, initializer)
      );
    }

    return [];

  }).flatten().reduce(mergeTrees) || new RelationTree();
}

export const normalize = flow(compile, renestRecursives);

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
RelationTree.normalize = normalize;
RelationTree.compile = compile;
RelationTree.mergeTrees = mergeTrees;

// -- Private helpers --

function mergeCustomizer(objectValue, sourceValue) {
  if (isRelationTree(objectValue) && isRelationTree(sourceValue)) {
    return mergeTrees(objectValue, sourceValue);
  }
}

function nodeFromString(string, properties) {
  const clonedProperties = { ...properties };

  const [name, recursionsString] = string.split('^');

  if (recursionsString != null) {
    const recursions = isEmpty(recursionsString) ? 1 : +recursionsString;
    clonedProperties.recursions = recursions;
  }

  return new RelationTree({ [name]: clonedProperties });
}
