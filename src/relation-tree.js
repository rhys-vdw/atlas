import _, { isEmpty, isArray, isString } from 'lodash';

function nodeFromString(string, properties) {
  let [name, recursions] = string.split('^');
  if (recursions != null) {
    recursions = isEmpty(recursions) ? 1 : +recursions;
    return { [name]: { nested: {
      [name]: { recursions, ...properties }
    } } }
  }
  return { [string]: properties }
}

export function fromString(string, initializer) {
  const list = _(string).split('.');

  const leaf = nodeFromString(list.last(), { initializer });

  return list.reverse().rest().reduce((nested, relation) =>
    nodeFromString(relation, { nested })
  , leaf);
}
