import { RELATION_TREE_SENTINEL } from './constants';
import _, {
  isEmpty, isArray, isObject, isString,
  merge, map, extend
} from 'lodash';

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

function assertType(value, name, testsByTypeName) {
  const isValid = _.any(testsByTypeName, (test, typeName) => test(value));

  if (!isValid) {
    const validTypes = _(testsByTypeName).keys();
    const humanized = [
      _.dropRight(validTypes, 1).join(', '),
      _.last(validTypes)
    ].join(' or ');

    throw new TypeError(
      `Expected '${name}' to be a ${humanized}, got ${value}`
    );
  }
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
  assertType(string, 'string', {string: isString});

  const list = _(string).split('.');
  const leaf = nodeFromString(list.last(), { initializer });

  return list.reverse().rest().reduce((nested, relation) =>
    nodeFromString(relation, { nested })
  , leaf);
}

export function renestRecursives(relationTree) {
  assertType(relationTree, 'relationTree', {RelationTree: isRelationTree});

  _.each(relationTree, (node, relationName) => {
    const { recursions } = node;
    if (recursions > 0) {
      const nestedRecursions = Math.max(recursions - 1, 0);

      // See if recursion has already been renested. If it has, we don't need
      // to do it again.
      const existing = node.nested && node.nested[relationName]
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

  return _(relations).map((relation) => {

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

export function normalize(...relations) {
  return renestRecursives(compile(...relations));
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
RelationTree.normalize = normalize;
RelationTree.compile = compile;

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
