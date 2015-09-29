import test from 'tape';
import MockedKnex from '../mocked-knex';
import Knex from 'knex';
import mapper from '../../lib/mapper';

const knex = Knex({});

test('Mapper', t => {

  t.test('Mapper#target() - one record with single primary key', t => {

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

      return ROWS;
    });

    const findMapper = mapper
      .knex(mocked)
      .table(TABLE)
      .idAttribute(ID_ATTRIBUTE)
      .target(RECORD);

    t.equals(
      findMapper.getOption('isSingle'), true,
      '`isSingle` is set to `true`'
    );

    t.resolvesTo(
      findMapper.fetch(),
      ROWS[0],
      'returns a single record'
    );
  });

  t.test('Mapper#target() - one record with composite primary key', t => {

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

      return ROWS;
    });

    const findMapper = mapper
      .knex(mocked)
      .table(TABLE)
      .idAttribute(ID_ATTRIBUTES)
      .target(RECORD);

    t.equals(findMapper.getOption('isSingle'), true, '`isSingle` is set to `true`');

    t.resolvesTo(
      findMapper.fetch(),
      ROWS[0],
      'returns a single record'
    );
  });

  t.test('Mapper#target() - with multiple records with single primary key', t => {

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

      return ROWS;
    });

    const allMapper = mapper
      .knex(mocked)
      .table(TABLE)
      .idAttribute(ID_ATTRIBUTE)
      .target(RECORDS);

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

  t.test('Mapper#target() - records with composite primary key', t => {

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

      return ROWS;
    });

    const allMapper = mapper
      .knex(mocked)
      .table(TABLE)
      .idAttribute(ID_ATTRIBUTES)
      .target(RECORDS);

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
