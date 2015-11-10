import Knex from 'knex';
import { each } from 'lodash/collection';

import Atlas from '../../lib/atlas';

import testMapper from './mapper';
import defaultConfig from './knex-config';

const configPath = process.env.ATLAS_TEST;

const config = configPath == null
  ? defaultConfig
  : require(configPath);

each(config, (connection, dialect) => {

  const knex = Knex({ dialect, connection, debug: true });
  const atlas = Atlas(knex);

  testMapper(atlas);
});
