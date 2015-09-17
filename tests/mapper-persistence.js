import test from 'tape';
import Knex from 'knex';
import MockedQueryBuilder from './mocked-query-builder'

import { zipObject } from 'lodash/array';
import Mapper, { instance as mapper } from '../lib/mapper';
import { NotFoundError, UnidentifiableRecordError } from '../lib/errors';

test('Mapper - persistence', t => {

  t.test('Mapper#insert()', t => {

    t.plan(5);

    t.resolvesTo(
      mapper.insert(), null,
      'resolves no arguments to `null`'
    );

    t.resolvesTo(
      mapper.insert(null), null,
      'resolves `null` to `null`'
    );

    t.resolvesTo(
      mapper.insert([]), [],
      'resolves empty array to empty array'
    );

   t.resolvesTo(
      mapper.insert([null, null]), [null, null],
      'resolves array of `null` values to an array of `null` values'
    );

    t.resolvesTo(
      mapper.insert(null, null), [null, null],
      'resolves multiple `null` value arguments to an array of `null` values'
    );
  });

  t.test('Mapper#insert() - single record, returning primary key', t => {

    const ID_ATTRIBUTE = 'ID_ATTRIBUTE';
    const ID_VALUE = 'ID_VALUE';
    const TABLE = 'TABLE';
    const RECORD = { text: 'a' };
    const knex = Knex({});

    t.plan(2);

    const mocked = MockedQueryBuilder(query => {
      t.queriesEqual(
        query,
        knex(TABLE).insert(RECORD, '*')
      );

      return [ID_VALUE];
    });

    const insertMapper = mapper
      .knex(mocked)
      .table(TABLE)
      .idAttribute(ID_ATTRIBUTE);

    const insertPromise = insertMapper.insert(RECORD);

    t.resolvesTo(
      insertPromise,
      { [ID_ATTRIBUTE]: ID_VALUE, ...RECORD },
      'assigns ID attribute'
    );
  });

  t.test(
    'Mapper#insert() - single record, with composite key, returning nothing',
    t => {

    const ID_ATTRIBUTES = ['ID_ATTRIBUTE_A', 'ID_ATTRIBUTE_B'];
    const TABLE = 'TABLE';
    const RECORD = { text: 'a' };
    const knex = Knex({});

    t.plan(2);

    const mocked = MockedQueryBuilder(query => {
      t.queriesEqual(
        query,
        knex(TABLE).insert(RECORD)
      );

      return [];
    });

    const insertMapper = mapper
      .knex(mocked)
      .table(TABLE)
      .idAttribute(ID_ATTRIBUTES);

    const insertPromise = insertMapper.insert(RECORD);

    t.resolvesTo(
      insertPromise,
      RECORD,
      'assigns ID attributes'
    );
  });

  t.test(
    'Mapper#insert() - multiple records with single key, returning first ' +
    'primary key only', t => {

    const ID_ATTRIBUTE = 'ID_ATTRIBUTE';
    const ID_VALUES = ['ID_VALUE_1'];
    const TABLE = 'TABLE';
    const RECORDS = [{ text: 'a' }, { text: 'b'}];
    const knex = Knex({ client: 'pg' });

    t.plan(2);

    const mocked = MockedQueryBuilder('pg', query => {
      t.queriesEqual(
        query,
        knex(TABLE).insert(RECORDS, '*')
      );

      return ID_VALUES;
    });

    const insertMapper = mapper
      .knex(mocked)
      .table(TABLE)
      .idAttribute(ID_ATTRIBUTE);

    const insertPromise = insertMapper.insert(RECORDS)

    t.resolvesTo(
      insertPromise,
      [
        { [ID_ATTRIBUTE]: ID_VALUES[0], ...RECORDS[0] },
        RECORDS[1],
      ],
      'assigns ID attribute to first record only'
    );
  });

  t.test('Mapper#insert() - multiple records, returning "*"', t => {

    const ID_VALUES = [
      ['ID_VALUE_A', 'ID_VALUE_B'],
      ['ID_VALUE_A', 'ID_VALUE_C']
    ];
    const TABLE = 'TABLE';
    const RECORDS = [{ text: 'a' }, { text: 'b'}];
    const knex = Knex({ client: 'pg' });

    t.plan(2);

    const mocked = MockedQueryBuilder('pg', query => {
      t.queriesEqual(
        query,
        knex(TABLE).insert(RECORDS, '*')
      );

      return [
        { text: 'a', otherText: 'b' },
        { text: 'changed', otherText: 'c' }
      ];
    });

    const insertMapper = mapper
      .knex(mocked)
      .table(TABLE);

    const insertPromise = insertMapper.insert(RECORDS)

    t.resolvesTo(
      insertPromise,
      [
        { text: 'a', otherText: 'b' },
        { text: 'changed', otherText: 'c' }
      ],
      'assigns all attributes to records'
    );
  });

  t.test('Mapper#update()', t => {

    t.plan(5);

    t.resolvesTo(
      mapper.update(), null,
      'resolves no arguments to `null`'
    );

    t.resolvesTo(
      mapper.update(null), null,
      'resolves `null` to `null`'
    );

    t.resolvesTo(
      mapper.update([]), [],
      'resolves empty array to empty array'
    );

    t.resolvesTo(
      mapper.update([null, null]), [null, null],
      'resolves array of `null` values to an array of `null` values'
    );

    t.resolvesTo(
      mapper.update(null, null), [null, null],
      'resolves multiple `null` value arguments to an array of `null` values'
    );
  });

  t.test(
    'Mapper#update() - single record, returning one record updated',
    t => {

    const ID_ATTRIBUTE = 'ID_ATTRIBUTE';
    const ID_VALUE = 'ID_VALUE';
    const TABLE = 'TABLE';
    const RECORD = { [ID_ATTRIBUTE]: ID_VALUE, text: 'a' };
    const knex = Knex({});

    t.plan(2);

    const mocked = MockedQueryBuilder(query => {
      t.queriesEqual(
        query,
        knex(TABLE).where(ID_ATTRIBUTE, ID_VALUE).update(RECORD, '*')
      );

      return 1;
    });

    const updateMapper = mapper
      .knex(mocked)
      .table(TABLE)
      .idAttribute(ID_ATTRIBUTE);

    const updatePromise = updateMapper.update(RECORD);

    t.resolvesTo(
      updatePromise,
      { ...RECORD },
      'resolves successfully'
    );
  });

  t.test(
    'Mapper#update() - single record, returning no records updated',
    t => {

    const ID_ATTRIBUTE = 'ID_ATTRIBUTE';
    const ID_VALUE = 'ID_VALUE';
    const TABLE = 'TABLE';
    const RECORD = { [ID_ATTRIBUTE]: ID_VALUE, text: 'a' };
    const knex = Knex({});

    const mocked = MockedQueryBuilder(query => 0);

    const updateMapper = mapper
      .knex(mocked)
      .table(TABLE)
      .idAttribute(ID_ATTRIBUTE);

    const updatePromise = updateMapper.update(RECORD);

    t.plan(1);

    t.rejects(
      updatePromise,
      NotFoundError,
      'rejects with `NotFoundError`'
    );
  });

  t.test(
    'Mapper#update() - single record with no `idAttribute` present',
    t => {

    const ID_ATTRIBUTE = 'ID_ATTRIBUTE';
    const ID_VALUE = 'ID_VALUE';
    const TABLE = 'TABLE';
    const RECORD = { text: 'a' };
    const knex = Knex({});

    const updateMapper = mapper.idAttribute(ID_ATTRIBUTE);
    const updatePromise = updateMapper.update(RECORD);

    t.plan(1);

    t.rejects(
      updatePromise,
      UnidentifiableRecordError,
      'rejects with `UnidentifiableRecordError`'
    );
  });

  t.end();
})
