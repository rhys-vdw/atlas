import test from 'tape';
import Mapper from '../../../lib/mapper';
import Knex from 'knex';
import CamelCase from '../../../lib/plugins/CamelCase';
import { NoRowsFoundError } from '../../../lib/errors';

const pg = Knex({ client: 'pg' });
const Pg = Mapper.knex(pg);

test('== Mapper - update all ==', t => {

  t.test('Mapper.prepareUpdateAll()', t => {

    const Users = Mapper.table('users').target(0, 1, 2)
      .prepareUpdateAll({ first_name: 'John', last_name: 'Smith' });

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
      .prepareUpdateAll({ first_name: 'John', last_name: 'Smith' });

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

  t.test('Mapper().strictAttributes().prepareUpdateAll()', t => {

    const Records = Mapper.table('records')
      .setState({ testState: 'testValue' })
      .strictAttributes({
        strict(attributes) {
          return this.requireState('testState') + '/' + attributes.strict;
        }
      }).prepareUpdateAll({ strict: 'overridden' });

    const queryBuilder = Records.toQueryBuilder();

    t.queriesEqual(queryBuilder, `
      update "records"
      set "strict" = 'testValue/overridden'
    `);

    t.end();
  });

  t.test('Mapper.prepareUpdateAll() - respects `attributeToColumn`', st => {

    const Users = Mapper.table('users').extend(CamelCase()).target(0, 1, 2)
      .prepareUpdateAll({ firstName: 'John', lastName: 'Smith' });

    st.queriesEqual(
      Users.toQueryBuilder(), `
        update "users"
        set "first_name" = 'John', "last_name" = 'Smith'
        where "users"."id" in (0, 1, 2)
      `,
      'correct query for SQL'
    );

    st.end();
  });


  t.test('Mapper.handleUpdateAllResponse() - receiving row data', t => {

    const SomeUsers = Pg.table('users').target(0, 1, 2).require();

    const response = [
      { id: 0, first_name: 'John', last_name: 'Smith' },
      { id: 1, first_name: 'Jane', last_name: 'Smythe' },
      { id: 2, first_name: 'Johan', last_name: 'Smitty' }
    ];

    const result = [
      { id: 0, first_name: 'John', last_name: 'Smith' },
      { id: 1, first_name: 'Jane', last_name: 'Smythe' },
      { id: 2, first_name: 'Johan', last_name: 'Smitty' }
    ];

    t.deepEqual(
      SomeUsers.handleUpdateAllResponse({ response }),
      result,
      'returns records'
    );

    t.throws(
      () => SomeUsers.handleUpdateAllResponse({ response: [] }),
      NoRowsFoundError,
      'throws `NoRowsFoundError` if none returned'
    );

    t.end();
  });

  t.test('Mapper.handleUpdateAllResponse() - respects `columnToAttribute`', t => {

    const SomeUsers = Pg.table('users').extend(CamelCase())
      .target(0, 1, 2).require();

    const response = [
      { id: 0, first_name: 'John', last_name: 'Smith' },
      { id: 1, first_name: 'Jane', last_name: 'Smythe' },
      { id: 2, first_name: 'Johan', last_name: 'Smitty' }
    ];

    const result = [
      { id: 0, firstName: 'John', lastName: 'Smith' },
      { id: 1, firstName: 'Jane', lastName: 'Smythe' },
      { id: 2, firstName: 'Johan', lastName: 'Smitty' }
    ];

    t.deepEqual(
      SomeUsers.handleUpdateAllResponse({ response }),
      result,
      'returns records with converted keys'
    );

    t.end();
  });


  t.test('Mapper.handleUpdateAllResponse() - receiving count', t => {
    const SomeUsers = Mapper.table('users').target(0, 1, 2).require();

    t.equal(
      SomeUsers.handleUpdateAllResponse({ response: 3 }),
      3,
      'returns count'
    );

    t.throws(
      () => SomeUsers.handleUpdateAllResponse({ response: 0 }),
      NoRowsFoundError,
      'throws `NoRowsFoundError` if count is zero'
    );

    t.end();
  });
});
