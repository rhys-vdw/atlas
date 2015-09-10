import { RELATION_TREE_SENTINEL } from './constants';
import _, { isEmpty, isArray, isObject, isString, merge, extend } from 'lodash';


const b = [
{ a:
  { recursions: undefined,
    nested: { b: { recursions: undefined, initializer: undefined } } } },
{ a:
  { recursions: undefined,
    nested:
    { c:
      { recursions: undefined,
        initializer: _.noop } } } } ]

logObject(_.reduce(b, _.merge));


function nodeFromString(string, properties) {

  if (!isString(string)) {
    throw new TypeError(`Expected 'string' to be string, got '${string}'`);
  }

  const [name, recursionsString] = string.split('^');
  let recursions;

  if (recursionsString != null) {
    recursions = isEmpty(recursionsString) ? 1 : +recursionsString;
  }

  return new RelationTree({ [name]: { recursions, ...properties } });
}

export function isRelationTree(maybeRelationTree) {
  return !!(maybeRelationTree && maybeRelationTree[RELATION_TREE_SENTINEL]);
}

export function fromString(string, initializer) {
  const list = _(string).split('.');
  const leaf = nodeFromString(list.last(), { initializer });

  return list.reverse().rest().reduce((nested, relation) =>
    nodeFromString(relation, { nested })
  , leaf);
}

function logObject(...objects) {
  console.log(
    ...objects.map((object) =>
      isObject(object) ? require('util').inspect(object, { depth: 10 }) : object
    )
  );
}

function doMerge(acc, value) {
  console.log('----------------');
  logObject('\nacc', acc, '\nvalue', value);
  let r = merge({}, acc, value);
  logObject('\nacc', acc, '\nvalue', value, '\nmerged', r);
  return r;
};

export function normalize(...relations) {

  return _(relations).map((relation) => {

    if (isRelationTree(relation))
      return relation;

    if (isString(relation))
      return fromString(relation);

    if (isArray(relation))
      return normalize(...relation);

    if (isObject(relation))
      return _.map(relation, (initializer, name) =>
        fromString(name, initializer)
      );

    return [];

  }).flatten().tap(logObject).reduce(doMerge, new RelationTree());

}

export default class RelationTree {
  constructor(properties) {
    extend(this, properties);
  }
  
  get [RELATION_TREE_SENTINEL]() { return true; }
}

RelationTree.isRelationTree = isRelationTree;
RelationTree.fromString = fromString;
