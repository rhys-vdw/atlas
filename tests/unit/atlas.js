import test from 'tape';
import Atlas from '../../lib/atlas';
import Mapper from '../../lib/mapper';
import Knex from 'knex';

import { omit } from 'lodash';

test('Atlas', t => {

  t.test('Atlas()', t => {
    const knex = Knex({});
    const atlas = Atlas(knex);

    t.deepEqual(
      atlas.registry._registry, { Mapper },
      '`atlas.registry` is as expected'
    );

    t.equal(
      atlas('Mapper').getOption('queryBuilder').client,
      knex.client,
      'Assigns `knex.client` to retrieved mapper'
    );

    const TestMapper = Mapper.table('test').where('thing', 5);
    const stored = TestMapper.toQueryBuilder();

    atlas.register('TestMapper', TestMapper);
    const retrieved = atlas('TestMapper').toQueryBuilder();

    t.queriesEqual(
      retrieved,
      stored,
      'Retrieved instance has correct query'
    );

    t.deepEqual(
      omit(atlas('TestMapper')._options, 'atlas', 'queryBuilder'),
      omit(TestMapper._options, 'queryBuilder'),
      'Retrieved instance has correct options'
    );

    t.end();
  });
});
