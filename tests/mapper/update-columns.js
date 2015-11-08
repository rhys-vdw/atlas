import test from 'tape';
import Mapper from '../../lib/mapper';
import Knex from 'knex';
import { NoRowsFoundError } from '../../lib/errors';

const pg = Knex({ client: 'pg' });
const Pg = Mapper.knex(pg);

test('== Mapper - update columns ==', t => {

  t.test('Mapper.prepareUpdateColumns()', t => {

    const Users = Mapper.table('users').target(0, 1, 2)
      .prepareUpdateColumns({ first_name: 'John', last_name: 'Smith' });

    t.queriesEqual(
      Users.toQueryBuilder(), `
        update "users"
        set "first_name" = 'John', "last_name" = 'Smith'
        where "users"."id" in (0, 1, 2)
      `,
      'correct query for SQL'
    );

    const PgUsers = Pg.table('users')
      .idAttribute('thing')
      .target(0, 1, 2)
      .prepareUpdateColumns({ first_name: 'John', last_name: 'Smith' });

    t.queriesEqual(
      PgUsers.toQueryBuilder(), `
        update "users"
        set "first_name" = 'John', "last_name" = 'Smith'
        where "users"."thing" in ('0', '1', '2')
        returning *
      `,
      'correct query for PostgreSQL'
    );

    t.end();
  });

  t.test('Mapper.handleUpdateColumnsResponse() - receiving row data', t => {

    const SomeUsers = Pg.table('users').target(0, 1, 2).require();

    const rowResponse = [
      { id: 0, first_name: 'John', last_name: 'Smith' },
      { id: 1, first_name: 'Jane', last_name: 'Smythe' },
      { id: 2, first_name: 'Johan', last_name: 'Smitty' }
    ];

    t.deepEqual(
      SomeUsers.handleUpdateColumnsResponse({ response: rowResponse }),
      rowResponse,
      'returns records'
    );

    t.throws(
      () => SomeUsers.handleUpdateColumnsResponse({ response: [] }),
      NoRowsFoundError,
      'throws `NoRowsFoundError` if none returned'
    );

    t.end();
  });

  t.test('Mapper.handleUpdateColumnsResponse() - receiving count', t => {
    const SomeUsers = Mapper.table('users').target(0, 1, 2).require();

    t.equal(
      SomeUsers.handleUpdateColumnsResponse({ response: 3 }),
      3,
      'returns count'
    );

    t.throws(
      () => SomeUsers.handleUpdateColumnsResponse({ response: 0 }),
      NoRowsFoundError,
      'throws `NoRowsFoundError` if count is zero'
    );

    t.end();
  });
});
