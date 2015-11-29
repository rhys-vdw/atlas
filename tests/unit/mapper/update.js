import test from 'tape';
import Knex from 'knex';

import Mapper from '../../../lib/mapper';
import { NotFoundError, UnidentifiableRecordError } from '../../../lib/errors';

const Pg = Mapper.knex(Knex({ client: 'pg' }));

test('== Mapper - update ==', t => {

  t.test('Mapper.update()', st => {

    st.plan(5);

    st.throws(
      () => Mapper.update(),
      TypeError,
      'throws `TypeError` synchronously with no arguments'
    );

    st.resolvesTo(
      Mapper.update(null), null,
      'resolves `null` to `null`'
    );

    st.resolvesToDeep(
      Mapper.update([]), [],
      'resolves empty array to empty array'
    );

    st.resolvesToDeep(
      Mapper.update([null, null]), [],
      'resolves array of `null` values to an empty array'
    );

    st.resolvesToDeep(
      Mapper.update(null, null), [],
      'resolves multiple `null` value arguments to an empty array'
    );
  });

  t.test('Mapper.prepareUpdate()', st => {

    const Records = Mapper
      .table('records')
      .idAttribute('record_id')
      .prepareUpdate({ record_id: 5, text: 'a' });

    st.queriesEqual(
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

    st.queriesEqual(
      PgRecords.toQueryBuilder(), `
        update "records"
        set "text" = 'a'
        where "record_id" = '5'
        returning *
      `, 'single record with PostgreSQL returning *'
    );

    st.throws(
      () => Mapper.prepareUpdate({}),
      UnidentifiableRecordError,
      'rejects with `UnidentifiableRecordError`'
    );

    st.throws(
      () => Mapper.prepareUpdate({ id: null }),
      UnidentifiableRecordError,
      'rejects with `UnidentifiableRecordError` on `null` key'
    );

    st.end();
  });

  t.test('Mapper.prepareUpdate() - composite keys', st => {

    const A = 'A';
    const B = 'B';

    const Composite = Pg.table('things').idAttribute([A, B]);

    st.throws(
      () => Composite.prepareUpdate({}),
      UnidentifiableRecordError,
      'rejects with `UnidentifiableRecordError` on empty record'
    );

    st.throws(
      () => Composite.prepareUpdate({A}),
      UnidentifiableRecordError,
      'rejects with `UnidentifiableRecordError` on one key missing'
    );

    st.throws(
      () => Composite.prepareUpdate({A: null, B}),
      UnidentifiableRecordError,
      'rejects with `UnidentifiableRecordError` when one key is null'
    );

    const UpdateComposite = Composite.prepareUpdate(
      {A: 'valA', B: 'valB', name: 'Bob' }
    );

    st.queriesEqual(
      UpdateComposite.toQueryBuilder(), `
        update "things"
        set "name" = 'Bob'
        where "A" = 'valA' and "B" = 'valB'
        returning *
      `, 'single record with PostgreSQL returning *'
    );

    st.end();
  });

  t.test('Mapper.handleUpdateRowResponse() - data response', st => {

    const record = { id: 5, name: 'Bob' };
    const result = Mapper.handleUpdateRowResponse({
      response: [{ id: 5, updated_at: 'time' }], record
    });

    st.deepEqual(
      result,
      { id: 5, updated_at: 'time', name: 'Bob' },
      'result is correct when response is row data array'
    );

    st.equal(result, record,
      'record is mutated in place when response is row data array'
    );

    st.end();
  });

  t.test('Mapper.handleUpdateRowResponse() - changed count response', st => {

    const record = { id: 5, name: 'Bob' };
    const result = Mapper.handleUpdateRowResponse({
      response: 1, record
    });

    st.deepEqual(
      result,
      { id: 5, name: 'Bob' },
      'result is correct when response is count'
    );

    st.equal(result, record,
      'record returned when response is count'
    );

    st.end();
  });

  t.test('Mapper.require().handleUpdateRowResponse()', st => {

    st.throws(
      () => Mapper.require().handleUpdateRowResponse({ response: 0 }),
      NotFoundError,
      'Throws `NotFoundError` when response is `0`'
    );

    st.throws(
      () => Mapper.require().handleUpdateRowResponse({ response: [] }),
      NotFoundError,
      'Throws `NotFoundError` when response is `[]`'
    );

    st.end();
  });

  t.test('Mapper.defaultAttributes().prepareUpdate()', st => {

    const Defaults = Mapper.table('table').defaultAttributes({
      default: 'default'
    });

    st.queriesEqual(
      Defaults.prepareUpdate({ id: 1, value: 'value' }).toQueryBuilder(),
      `update "table" set "value" = 'value' where "id" = 1`,
      'do not affect update query'
    );

    st.end();
  });

  t.test('Mapper.strictAttributes().prepareUpdate()', st => {

    const Strict = Mapper.table('table').strictAttributes({
      strict: 'strict'
    });

    st.queriesEqual(
      Strict.prepareUpdate({ id: 1, strict: 'overridden' }).toQueryBuilder(),
      `update "table" set "strict" = 'strict' where "id" = 1`
    );

    const FnStrict = Mapper.table('table').strictAttributes({
      strict: () => 'strict'
    });

    st.queriesEqual(
      FnStrict
        .prepareUpdate({ id: 2, other: 'other', strict: 'overridden' })
        .toQueryBuilder(),
      `update "table" set "other" = 'other', "strict" = 'strict' where "id" = 2`
    );

    st.end();
  });

  t.end();
});
