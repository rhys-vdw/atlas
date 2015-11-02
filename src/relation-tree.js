import _ from 'lodash';
import { isEmpty, isArray, isObject, isString } from 'lodash/lang';
import { merge, extend } from 'lodash/object';
import { map, each } from 'lodash/collection';
import { flow } from 'lodash/function';

import { sentinel, instanceWithSentinel } from './sentinel';
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
export const isRelationTree = instanceWithSentinel(RELATION_TREE_SENTINEL);


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
  return merge(destination, source, mergeCustomizer);
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

  const list = _(string).split('.');
  const leaf = nodeFromString(list.last(), { initializer });

  return list.reverse().rest().reduce((nested, relation) =>
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
      if (existing) {

        // Assert that the tree is valid. This should never be fired.
        if (existing.recursions !== nestedRecursions) throw new Error(
          `Invalid nesting of a recursive relation '${relationName}'`
        );

      } else {

        // Push recursive node down from root by inserting a copy in its place
        // and renesting it in with a decremented recursion count.
        const nestedNode = new RelationTree(node);
        nestedNode.recursions = nestedRecursions;
        relationTree[relationName] = {
          recursions,
          nested: {
            [relationName]: nestedNode
          }
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
@sentinel(RELATION_TREE_SENTINEL);
export default class RelationTree {
  constructor(properties) {
    extend(this, properties);
  }
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
  const [name, recursionsString] = string.split('^');
  let recursions;

  if (recursionsString != null) {
    recursions = isEmpty(recursionsString) ? 1 : +recursionsString;
  }

  return new RelationTree({ [name]: { recursions, ...properties } });
}
