import _ from 'lodash';
import test from 'tape';
import Knex from 'knex';

import Mapper from '../../../lib/mapper';

const Pg = Mapper.knex(Knex({ client: 'pg' }));

test('== Mapper - insert ==', t => {

  t.test('Mapper.insert()', t => {

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

  t.test('Mapper.prepareInsert()', t => {

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

  t.test('Mapper.handleInsertOneResponse()', t => {

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


  t.test('Mapper.handleInsertManyResponse() - single ID response', t => {

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

  t.test('Mapper.handleInsertManyResponse() - PostgreSQL response', t => {
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

  t.end();
});
