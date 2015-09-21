import test from 'tape';
import MockedKnex from '../mocked-knex';
import Knex from 'knex';
import mapper from '../../lib/mapper';

const knex = Knex({});

test('Mapper', t => {

  t.test('Mapper#one() - no arguments', t => {

    const TABLE = 'TABLE';
    const ROWS = [
      { id: 1, name: 'name1' }
    ];

    t.plan(3);

    const mocked = MockedKnex(query => {
      t.queriesEqual(query,
        knex(TABLE).select(`${TABLE}.*`).limit(1)
      );

      return { rows: ROWS }
    });

    const oneMapper = mapper.knex(mocked).table(TABLE).one();

    t.equals(oneMapper.getOption('isSingle'), true, '`isSingle` is set to `true`');

    t.resolvesTo(
      oneMapper.fetch(),
      ROWS[0],
      'returns a single record'
    );
  });

  t.test('Mapper#one() - with record with single primary key', t => {

    const ID_ATTRIBUTE = 'ID_ATTRIBUTE';
    const ID_VALUE = 'ID_VALUE';
    const TABLE = 'TABLE';
    const RECORD = { [ID_ATTRIBUTE]: ID_VALUE };
    const ROWS = [ { [ID_ATTRIBUTE]: ID_VALUE, name: 'name' } ];

    t.plan(3);

    const mocked = MockedKnex(query => {
      t.queriesEqual(query,
        knex(TABLE).where(ID_ATTRIBUTE, ID_VALUE).select(`${TABLE}.*`).limit(1)
      );

      return { rows: ROWS }
    });

    const oneMapper = mapper
      .knex(mocked)
      .table(TABLE)
      .idAttribute(ID_ATTRIBUTE)
      .one(RECORD);

    t.equals(oneMapper.getOption('isSingle'), true, '`isSingle` is set to `true`');

    t.resolvesTo(
      oneMapper.fetch(),
      ROWS[0],
      'returns a single record'
    );
  });

  t.test('Mapper#one() - with record with composite primary key', t => {

    const ID_ATTRIBUTE_A = 'ID_ATTRIBUTE_A';
    const ID_ATTRIBUTE_B = 'ID_ATTRIBUTE_B';
    const ID_VALUE_A = 'ID_VALUE_A';
    const ID_VALUE_B = 'ID_VALUE_B';
    const ID_ATTRIBUTES = [ID_ATTRIBUTE_A, ID_ATTRIBUTE_B];
    const ID_VALUES = [ID_VALUE_A, ID_VALUE_B];

    const TABLE = 'TABLE';
    const RECORD = {
      [ID_ATTRIBUTE_A]: ID_VALUE_A,
      [ID_ATTRIBUTE_B]: ID_VALUE_B
    };
    const ROWS = [ {
      [ID_ATTRIBUTE_A]: ID_VALUE_A,
      [ID_ATTRIBUTE_B]: ID_VALUE_B,
      name: 'name'
    } ];

    t.plan(3);

    const mocked = MockedKnex(query => {
      t.queriesEqual(query,
        knex(TABLE).where(ID_ATTRIBUTES, ID_VALUES).select(`${TABLE}.*`).limit(1)
      );

      return { rows: ROWS }
    });

    const oneMapper = mapper
      .knex(mocked)
      .table(TABLE)
      .idAttribute(ID_ATTRIBUTES)
      .one(RECORD);

    t.equals(oneMapper.getOption('isSingle'), true, '`isSingle` is set to `true`');

    t.resolvesTo(
      oneMapper.fetch(),
      ROWS[0],
      'returns a single record'
    );
  });

  t.test('Mapper#all() - no arguments', t => {

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

      return { rows: ROWS }
    });

    const allMapper = mapper.knex(mocked).table(TABLE).all();

    t.equals(allMapper.getOption('isSingle'), false, '`isSingle` is set to `false`');

    t.resolvesTo(
      allMapper.fetch(),
      ROWS,
      'returns an array of records'
    );
  });

  t.test('Mapper#all() - with records with single primary key', t => {

    const ID_ATTRIBUTE = 'ID_ATTRIBUTE';
    const TABLE = 'TABLE';
    const RECORDS = [
      { [ID_ATTRIBUTE]: 1 },
      { [ID_ATTRIBUTE]: 2 },
    ]
    const ROWS = [
      { [ID_ATTRIBUTE]: 1, name: 'name1' },
      { [ID_ATTRIBUTE]: 2, name: 'name2' }
    ];

    t.plan(3);

    const mocked = MockedKnex(query => {
      t.queriesEqual(query,
        knex(TABLE).whereIn(ID_ATTRIBUTE, [1, 2]).select(`${TABLE}.*`)
      );

      return { rows: ROWS }
    });

    const allMapper = mapper
      .knex(mocked)
      .table(TABLE)
      .idAttribute(ID_ATTRIBUTE)
      .all(RECORDS);

    t.equals(allMapper.getOption('isSingle'), false, '`isSingle` is set to `false`');

    t.resolvesTo(
      allMapper.fetch(),
      ROWS,
      'returns an array of records'
    );
  });

  t.test('Mapper#all() - with record with composite primary key', t => {

    const ID_ATTRIBUTE_A = 'ID_ATTRIBUTE_A';
    const ID_ATTRIBUTE_B = 'ID_ATTRIBUTE_B';
    const ID_ATTRIBUTES = [ID_ATTRIBUTE_A, ID_ATTRIBUTE_B];
    const ID_VALUES = [[1, 2], [3, 4]];

    const TABLE = 'TABLE';
    const RECORDS = [
      { [ID_ATTRIBUTE_A]: 1, [ID_ATTRIBUTE_B]: 2 },
      { [ID_ATTRIBUTE_A]: 3, [ID_ATTRIBUTE_B]: 4 }
    ];
    const ROWS = [
      { [ID_ATTRIBUTE_A]: 1, [ID_ATTRIBUTE_B]: 2, name: 'name1' },
      { [ID_ATTRIBUTE_A]: 3, [ID_ATTRIBUTE_B]: 4, name: 'name2' }
    ];

    t.plan(3);

    const mocked = MockedKnex(query => {
      t.queriesEqual(query,
        knex(TABLE).whereIn(ID_ATTRIBUTES, ID_VALUES).select(`${TABLE}.*`)
      );

      return { rows: ROWS }
    });

    const allMapper = mapper
      .knex(mocked)
      .table(TABLE)
      .idAttribute(ID_ATTRIBUTES)
      .all(RECORDS);

    t.equals(allMapper.getOption('isSingle'), false, '`isSingle` is set to `true`');

    t.resolvesTo(
      allMapper.fetch(),
      ROWS,
      'returns an array of records'
    );
  });
});
