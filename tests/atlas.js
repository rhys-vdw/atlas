import test from 'tape';
import Atlas from '../lib/atlas';
import Mapper from '../lib/mapper';

test('Atlas', t => {

  t.test('Atlas()', t => {
    const KNEX_PLACEHOLDER = 'KNEX_PLACEHOLDER';
    const atlas = Atlas(KNEX_PLACEHOLDER);

    t.deepEqual(
      atlas.registry._registry, { Mapper },
      '`atlas.registry` is as expected'
    );

    t.equal(
      atlas('Mapper').getOption('knex'), KNEX_PLACEHOLDER,
      'Assigns `knex` to retrieved mapper'
    );

    const TestMapper = Mapper.table('test');
    atlas.register('TestMapper', TestMapper);

    t.deepEqual(
      atlas('TestMapper'), TestMapper.knex(KNEX_PLACEHOLDER),
      'Allows registered instance to be retrieved'
    );

    t.end();
  });

  t.end();
});
