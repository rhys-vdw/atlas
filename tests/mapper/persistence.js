import _ from 'lodash';
import test from 'tape';
import Knex from 'knex';
const MockedKnex = null;

import Mapper from '../../lib/mapper';
import { NotFoundError, UnidentifiableRecordError } from '../../lib/errors';

const Pg = Mapper.knex(Knex({ client: 'pg' }));

test('Mapper - persistence', t => {

  t.test('Mapper#insert()', t => {

    t.plan(5);

    t.resolvesTo(
      Mapper.insert(), [],
      'resolves no arguments to empty array'
    );

    t.resolvesTo(
      Mapper.insert(null), null,
      'resolves `null` to `null`'
    );

    t.resolvesTo(
      Mapper.insert([]), [],
      'resolves empty array to empty array'
    );

    t.resolvesTo(
      Mapper.insert([null, null]), [],
      'resolves array of `null` values to an empty array'
    );

    t.resolvesTo(
      Mapper.insert(null, null), [],
      'resolves multiple `null` value arguments to an empty array'
    );
  });

  t.test('Mapper#insert() - single record, returning primary key', t => {

    const Records = Mapper
      .table('records')
      .idAttribute('record_id')
      .prepareInsert({ text: 'a' });

    t.queriesEqual(
      Records.toQueryBuilder(),
      `insert into "records" ("text") values ('a')`
    );

    t.deepEqual(
      Records._handleInsertOneResponse([5], { text: 'a' }),
      { record_id: 5, text: 'a' },
      'assigns ID attribute'
    );

    t.end();
  });

  t.test('Mapper#insert() - single record, with composite key, result empty',
  t => {

    const Things = Mapper
      .table('things')
      .idAttribute(['id_a', 'id_b'])
      .prepareInsert({ item: 'a' });

    t.queriesEqual(
      Things.toQueryBuilder(),
      `insert into "things" ("item") values ('a')`
    );

    t.deepEqual(
      Things._handleInsertOneResponse([], { item: 'a' }),
      { item: 'a' },
      'returns unmodified record'
    );

    t.end();
  });

  t.test(
    'Mapper#insert() - multiple records with single key, returning first ' +
    'primary key only',
  t => {

    const records = [{ color: 'red' }, { color: 'green' }];

    const Apples = Mapper
      .table('apples')
      .idAttribute('code')
      .prepareInsert(records);

    t.queriesEqual(
      Apples.toQueryBuilder(),
      `insert into "apples" ("color") values ('red'), ('green')`
    );

    t.deepEqual(
      Apples._handleInsertManyResponse([1234], records),
      [{ code: 1234, color: 'red' }, { color: 'green' }],
      'assigns ID attribute to first record only'
    );

    t.end();
  });

  t.test('Mapper#insert() - multiple records, returning "*"', t => {

    const records = [{ name: 'valencia' }, { name: 'navel'}];

    const Oranges = Pg
      .table('oranges')
      .prepareInsert(records);

    t.queriesEqual(
      Oranges.toQueryBuilder(), `
        insert into "oranges" ("name")
        values ('valencia'), ('navel')
        returning *
      `
    );

    const response = [
      { id: 1, name: 'valencia', created_at: 'some_date' },
      { id: 2, name: 'navel', created_at: 'some_time' }
    ];

    const result = Oranges._handleInsertManyResponse(response, records);

    _(records).zip(result).each(([inserted, returned]) => {
      t.equal(inserted, returned, 'record is mutated');
    }).value();

    t.deepEqual(
      response,
      [
        { id: 1, name: 'valencia', created_at: 'some_date' },
        { id: 2, name: 'navel', created_at: 'some_time' }
      ],
      'assigns ID attribute to first record only'
    );

    t.end();
  });

  t.skip('Mapper#update()', t => {

    t.plan(5);

    t.resolvesTo(
      Mapper.update(), null,
      'resolves no arguments to `null`'
    );

    t.resolvesTo(
      Mapper.update(null), null,
      'resolves `null` to `null`'
    );

    t.resolvesTo(
      Mapper.update([]), [],
      'resolves empty array to empty array'
    );

    t.resolvesTo(
      Mapper.update([null, null]), [null, null],
      'resolves array of `null` values to an array of `null` values'
    );

    t.resolvesTo(
      Mapper.update(null, null), [null, null],
      'resolves multiple `null` value arguments to an array of `null` values'
    );
  });

  t.skip(
    'Mapper#update() - single record, returning one record updated',
  t => {

    const ID_ATTRIBUTE = 'ID_ATTRIBUTE';
    const ID_VALUE = 'ID_VALUE';
    const TABLE = 'TABLE';
    const RECORD = { [ID_ATTRIBUTE]: ID_VALUE, text: 'a' };

    t.plan(2);

    const mocked = MockedKnex(query => {
      t.queriesEqual(query, `
        update "${TABLE}"
        set
          "${ID_ATTRIBUTE}" = '${ID_VALUE}',
          "text" = 'a'
        where "ID_ATTRIBUTE" = 'ID_VALUE'
      `);

      return 1;
    });

    const updateMapper = Mapper
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

  t.skip(
    'Mapper#update() - single record, returning no records updated',
  t => {

    const ID_ATTRIBUTE = 'ID_ATTRIBUTE';
    const ID_VALUE = 'ID_VALUE';
    const TABLE = 'TABLE';
    const RECORD = { [ID_ATTRIBUTE]: ID_VALUE, text: 'a' };

    const mocked = MockedKnex(query => 0);

    const updateMapper = Mapper
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

  t.skip(
    'Mapper#update() - single record with no `idAttribute` present',
  t => {

    const ID_ATTRIBUTE = 'ID_ATTRIBUTE';
    const RECORD = {};

    t.plan(1);

    t.rejects(
      Mapper.idAttribute(ID_ATTRIBUTE).update(RECORD),
      UnidentifiableRecordError,
      'rejects with `UnidentifiableRecordError`'
    );
  });

  t.end();
});
