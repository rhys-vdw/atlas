import Knex from 'knex';
import { each } from 'lodash/collection';

import Atlas from '../../lib/atlas';

import test from 'tape';
import testMapper from './mapper';
import defaultConfig from './knex-config';

const configPath = process.env.ATLAS_TEST;

const config = configPath == null
  ? defaultConfig
  : require(configPath);

each(config, (connection, dialect) => {

  const knex = Knex({
    dialect,
    connection,
    // debug: true,
  });
  const atlas = Atlas(knex);

  testMapper(atlas);

  // Not really requiring testing, but putting it in a test here defers its
  // execution until integration tests have resolved.
  test(`destroy ${dialect} Knex instance`, t => {
    knex.destroy().then(() => t.end());
  });
});
