import test from 'tape';
import MockedKnex from '../mocked-knex';
import Knex from 'knex';
import mapper from '../../lib/mapper';

const knex = Knex({});

test('Mapper', t => {

  t.test('Mapper#one()', t => {

    const TABLE = 'TABLE';
    const ROWS = [
      { id: 1, name: 'name1' }
    ];

    t.plan(3);

    const mocked = MockedKnex(query => {
      t.queriesEqual(query,
        knex(TABLE).select(`${TABLE}.*`).limit(1)
      );

      return ROWS;
    });

    const oneMapper = mapper.knex(mocked).table(TABLE).one();

    t.equals(oneMapper.getOption('isSingle'), true, '`isSingle` is set to `true`');

    t.resolvesTo(
      oneMapper.fetch(),
      ROWS[0],
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

    t.equals(allMapper.getOption('isSingle'), false, '`isSingle` is set to `false`');

    t.resolvesTo(
      allMapper.fetch(),
      ROWS,
      'returns an array of records'
    );
  });
});
