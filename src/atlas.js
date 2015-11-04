import Registry from './registry';
import Mapper from './mapper';
import { isPlainObject, isString } from 'lodash/lang';

const createRegistry = () => new Registry({ Mapper });

function Atlas(knex, registry = createRegistry()) {

  function atlas(mapperOrName) {
    const mapper = isString(mapperOrName)
      ? atlas.registry.retrieve(mapperOrName)
      : mapperOrName;

    return mapper.knex(knex);
  }

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
      callback(new Atlas(trx, registry))
    );

  return atlas;
}

export default Atlas;
