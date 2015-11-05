import Registry from './registry';
import Mapper from './mapper';
import { isPlainObject, isString } from 'lodash/lang';

const createRegistry = () => new Registry({ Mapper });

function ReadOnlyAtlas(knex) {
  return function atlas(mapperOrName) {
    const mapper = isString(mapperOrName)
      ? atlas.registry.retrieve(mapperOrName)
      : mapperOrName;

    return mapper.knex(knex);
  };
}

export default function Atlas(knex, registry = createRegistry()) {

  const atlas = ReadOnlyAtlas(knex, registry);

  atlas.registry = isPlainObject(registry)
    ? new Registry(registry)
    : registry;

  atlas.register = (name, mapper) => {
    atlas.registry.register(name, mapper);
    return atlas;
  };

  atlas.override = (name, mapper) => {
    atlas.registry.override(name, mapper);
    return atlas;
  };

  atlas.transaction = (callback) =>
    knex.transaction(trx =>
      callback(ReadOnlyAtlas(trx, registry))
    );

  return atlas;
}
