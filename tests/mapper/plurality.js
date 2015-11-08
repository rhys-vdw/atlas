/*
import test from 'tape';
import Mapper from '../../lib/mapper';

test('Mapper - plurality', t => {

  Mapper
  t.test('Mapper#one()', t => {

    const Flower = mapper.table('flowers').one();

    t.queriesEqual(
      Flower.prepareFetch().toQueryBuilder(), `
        select "flowers".*
        from "flowers"
        limit 1
      `
    );

      return [{ id: 1, name: 'name1' }];
    });

    t.equals(
      oneMapper.getOption('isSingle'), true,
      '`isSingle` is set to `true`'
    );

    t.resolvesTo(
      oneMapper.fetch(),
      { id: 1, name: 'name1' },
      'returns a single record'
    );
  });

  t.test('Mapper#all()', t => {

    const TABLE = 'TABLE';
    const ROWS = [
      { id: 1, name: 'name1' },
      { id: 2, name: 'name2' }
    ];

    t.plan(3);

    const mocked = MockedKnex(query => {
      t.queriesEqual(query,
        knex(TABLE).select(`${TABLE}.*`)
      );

      return ROWS;
    });

    const allMapper = mapper.knex(mocked).table(TABLE).all();

    t.equals(
      allMapper.getOption('isSingle'), false,
      '`isSingle` is set to `false`'
    );

    t.resolvesTo(
      allMapper.fetch(),
      ROWS,
      'returns an array of records'
    );
  });
});
*/
