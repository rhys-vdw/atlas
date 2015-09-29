import test from 'tape';
import Knex from 'knex';
import MockedKnex from '../mocked-knex'

import mapper from '../../lib/mapper';
import { NoRecordsFoundError } from '../../lib/errors';

test('Mapper - retrieval', t => {

  t.test('defaultOptions', t => {

    t.equal(
      mapper.getOption('isSingle'), false,
      'isSingle = false'
    );

    t.equal(
      mapper.getOption('isRequired'), false,
      'isRequired = false'
    );

    t.end();
  });

  t.test('Mapper#fetchOne()', t => {

    const TABLE = 'TABLE';
    const ROWS = [{ id: 1 }];
    
    t.plan(2);

    const mocked = MockedKnex(query => {
      t.queriesEqual(
        query, `select "${TABLE}".* from "${TABLE}" limit 1`
      );

      return ROWS;
    })

    mapper.table(TABLE).knex(mocked).fetchOne().then(record =>
      t.deepEqual(record, ROWS[0], 'returns single record')
    );

  });

  t.test('Mapper#fetchAll()', t => {

    const TABLE = 'TABLE';
    const ROWS = [{ id: 1 }, { id: 2 }];

    t.plan(2);

    const mocked = MockedKnex(query => {
      t.queriesEqual(
        query, `select "${TABLE}".* from "${TABLE}"`
      );

      return ROWS;
    });

    mapper.table(TABLE).knex(mocked).fetchAll().then(record =>
      t.deepEqual(record, ROWS, 'returns array of records')
    );

  });

  t.test('Mapper#require()', t => {

    const TABLE = 'TABLE';
    const EMPTY_ROWS = [];
    const FULL_ROWS = [{ id: 1 }, { id: 2 }];

    t.plan(2);

    const mockedEmpty = MockedKnex(() => EMPTY_ROWS);

    t.rejects(
      mapper.knex(mockedEmpty).table(TABLE).require().fetch(),
      NoRecordsFoundError,
      'rejects on empty result set with `NoRecordsFoundError`'
    );

    const mockedFull = MockedKnex(() => FULL_ROWS);

    t.resolvesTo(
      mapper.knex(mockedFull).table(TABLE).fetch(),
      FULL_ROWS,
      'resolves correctly when not set'
    );

  });
});
