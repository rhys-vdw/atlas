import { isObject, isString, each } from 'lodash';
import Registry from './registry';
import Mapper from './mapper';
import { initialize as initializeRelations } from './relations';
import { related } from './related';
import plugins from './plugins';

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
    return mapper.withMutations({ atlas, knex });
  };
};

export default function Atlas(knex, registry = createRegistry()) {

  const atlas = createAtlas(knex, registry);

  atlas.knex = knex;
  atlas.registry = registry;

  atlas.register = (name, mapper) => {
    if (isObject(name)) {
      each(name, (value, key) => registry.register(key, value));
    } else {
      registry.register(name, mapper);
    }
    return atlas;
  };

  atlas.override = (name, mapper) => {
    if (isObject(name)) {
      each(name, (value, key) => registry.override(key, value));
    } else {
      registry.override(name, mapper);
    }
    return atlas;
  };

  // Create transaction method.
  atlas.transaction = function transaction(callback) {
    return knex.transaction(trx => callback(createAtlas(trx, registry)));
  };

  // Initialize and assign relation builders.
  const toMapper = createToMapper(registry);
  atlas.relations = initializeRelations(toMapper);

  // Assign `related` helper for eager loading definitions.
  atlas.related = related;

  return atlas;
}

// Assign plugins.
Atlas.plugins = plugins;
