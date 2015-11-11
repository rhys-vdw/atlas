import Registry from './registry';
import Mapper from './mapper';
import { initialize as initializeRelations } from './relations';
import { isString } from 'lodash/lang';

const createRegistry = () => new Registry({ Mapper });

const createToMapper = (registry) => (mapperOrName) => {
  return isString(mapperOrName)
    ? registry.retrieve(mapperOrName)
    : mapperOrName;
};

const createAtlas = (knex, registry) => {
  const toMapper = createToMapper(registry);
  return function atlas(mapperOrName) {
    const mapper = toMapper(mapperOrName);
    return mapper.knex(knex);
  };
};

export default function Atlas(knex, registry = createRegistry()) {

  const atlas = createAtlas(knex, registry);

  atlas.knex = knex;
  atlas.registry = registry;

  atlas.register = (name, mapper) => {
    registry.register(name, mapper);
    return atlas;
  };

  atlas.override = (name, mapper) => {
    registry.override(name, mapper);
    return atlas;
  };

  atlas.transaction = (callback) => knex.transaction(trx =>
    callback(createAtlas(trx, registry))
  );

  const toMapper = createToMapper(registry);
  atlas.relations = initializeRelations(toMapper);

  return atlas;
}
