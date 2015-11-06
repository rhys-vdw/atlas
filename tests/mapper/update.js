import test from 'tape';
import Knex from 'knex';

import Mapper from '../../lib/mapper';
import { NotFoundError, UnidentifiableRecordError } from '../../lib/errors';

const Pg = Mapper.knex(Knex({ client: 'pg' }));

test('== Mapper - update ==', t => {

  t.test('Mapper.update()', t => {

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

  t.test('Mapper.prepareUpdate()', t => {

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

    const PgRecords = Pg
      .table('records')
      .idAttribute('record_id')
      .prepareUpdate({ record_id: 5, text: 'a' });

    t.queriesEqual(
      PgRecords.toQueryBuilder(), `
        update "records"
        set "text" = 'a'
        where "record_id" = '5'
        returning *
      `, 'single record with PostgreSQL returning *'
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

    t.end();
  });

  t.end();
});
