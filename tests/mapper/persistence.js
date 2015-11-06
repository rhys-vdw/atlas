import _ from 'lodash';
import test from 'tape';
import Knex from 'knex';

import Mapper from '../../lib/mapper';
import { NotFoundError, UnidentifiableRecordError } from '../../lib/errors';

const Pg = Mapper.knex(Knex({ client: 'pg' }));

test('Mapper - persistence', t => {

  t.test('Mapper#insert()', t => {

    t.plan(5);

    t.throws(
      () => Mapper.insert(),
      TypeError,
      'throws `TypeError` synchronously with no arguments'
    );

    t.resolvesTo(
      Mapper.insert(null), null,
      'resolves `null` to `null`'
    );

    t.resolvesToDeep(
      Mapper.insert([]), [],
      'resolves empty array to empty array'
    );

    t.resolvesToDeep(
      Mapper.insert([null, null]), [],
      'resolves array of `null` values to an empty array'
    );

    t.resolvesToDeep(
      Mapper.insert(null, null), [],
      'resolves multiple `null` value arguments to an empty array'
    );
  });

  t.test('Mapper#prepareInsert()', t => {

    const Records = Mapper.table('records').prepareInsert(
      { text: 'a' }
    );

    t.queriesEqual(
      Records.toQueryBuilder(),
      `insert into "records" ("text") values ('a')`,
      `single record - SQL`
    );

    const Things = Pg.table('things').prepareInsert(
      { item: 'a' }
    );

    t.queriesEqual(
      Things.toQueryBuilder(),
      `insert into "things" ("item") values ('a') returning *`,
      `single record - PostgreSQL`
    );

    const Apples = Mapper.table('apples').prepareInsert([
      { color: 'red' },
      { color: 'green' }
    ]);

    t.queriesEqual(
      Apples.toQueryBuilder(),
      `insert into "apples" ("color") values ('red'), ('green')`,
      `multiple records`
    );

    t.end();
  });

  t.test('Mapper#handleInsertOneResponse()', t => {

    const Records = Mapper.idAttribute('record_id');

    t.deepEqual(
      Records.handleInsertOneResponse([5], { text: 'a' }),
      { record_id: 5, text: 'a' },
      'ID array response'
    );

    t.deepEqual(
      Records.handleInsertOneResponse([], { item: 'a' }),
      { item: 'a' },
      'Empty response'
    );

    t.end();
  });


  t.test('Mapper#handleInsertManyResponse() - single ID response', t => {

    const records = [
      { code: 1234, color: 'red' },
      { color: 'green' }
    ];

    const Records = Mapper.idAttribute('code');

    t.deepEqual(
      Records.handleInsertManyResponse([1234], records),
      [{ code: 1234, color: 'red' }, { color: 'green' }],
      'assigns ID attribute to first record only'
    );

    t.end();
  });

  t.test('Mapper#handleInsertManyResponse() - PostgreSQL response', t => {
    const Oranges = Pg.table('oranges');
    const oranges = [{ name: 'valencia' }, { name: 'navel'}];

    const response = [
      { id: 1, name: 'valencia', created_at: 'some_date' },
      { id: 2, name: 'navel', created_at: 'some_time' }
    ];

    const result = Oranges.handleInsertManyResponse(response, oranges);

    _(oranges).zip(result).each(([inserted, returned], index) => {
      t.equal(inserted, returned, `record ${index} is mutated`);
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

  t.test('Mapper#update()', t => {

    t.plan(5);

    t.throws(
      () => Mapper.update(),
      TypeError,
      'throws `TypeError` synchronously with no arguments'
    );

    t.resolvesTo(
      Mapper.update(null), null,
      'resolves `null` to `null`'
    );

    t.resolvesToDeep(
      Mapper.update([]), [],
      'resolves empty array to empty array'
    );

    t.resolvesToDeep(
      Mapper.update([null, null]), [],
      'resolves array of `null` values to an empty array'
    );

    t.resolvesToDeep(
      Mapper.update(null, null), [],
      'resolves multiple `null` value arguments to an empty array'
    );
  });

  t.test('Mapper#prepareUpdate()', t => {

    const Records = Mapper
      .table('records')
      .idAttribute('record_id')
      .prepareUpdate({ record_id: 5, text: 'a' });

    t.queriesEqual(
      Records.toQueryBuilder(), `
        update "records"
        set "text" = 'a'
        where "record_id" = 5
      `, 'single record'
    );

    t.throws(
      () => Mapper.prepareUpdate({}),
      UnidentifiableRecordError,
      'rejects with `UnidentifiableRecordError`'
    );

    t.end();
  });

  t.test('Mapper.handleUpdateRowResponse() - data response', t => {

    const record = { id: 5, name: 'Bob' };
    const result = Mapper.handleUpdateRowResponse({
      response: [{ id: 5, updated_at: 'time' }], record
    });

    t.deepEqual(
      result,
      { id: 5, updated_at: 'time', name: 'Bob' },
      'result is correct when response is row data array'
    );

    t.equal(result, record,
      'record is mutated in place when response is row data array'
    );

    t.end();
  });

  t.test('Mapper.handleUpdateRowResponse() - changed count response', t => {

    const record = { id: 5, name: 'Bob' };
    const result = Mapper.handleUpdateRowResponse({
      response: 1, record
    });

    t.deepEqual(
      result,
      { id: 5, name: 'Bob' },
      'result is correct when response is count'
    );

    t.equal(result, record,
      'record returned when response is count'
    );

    t.end();
  });

  t.test('Mapper.require().handleUpdateRowResponse()', t => {

    t.throws(
      () => Mapper.require().handleUpdateRowResponse({ response: 0 }),
      NotFoundError,
      'Throws `NotFoundError` when response is `0`'
    );

    t.throws(
      () => Mapper.require().handleUpdateRowResponse({ response: [] }),
      NotFoundError,
      'Throws `NotFoundError` when response is `[]`'
    );

    t.end()
  });

  t.end();
});
