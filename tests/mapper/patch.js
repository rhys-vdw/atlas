import test from 'tape';
import MockedKnex from '../mocked-knex';
import Mapper from '../../lib/mapper';

test('Mapper - patch', t => {

  t.test('Mapper#patch() - receiving rows', t => {

    const response = [
      { id: 0, first_name: 'John', last_name: 'Smith' },
      { id: 1, first_name: 'John', last_name: 'Smith' },
      { id: 2, first_name: 'John', last_name: 'Smith' }
    ];

    t.plan(2);

    const mocked = MockedKnex('pg', query => {
      t.queriesEqual(query, `
        update "users"
        set "first_name" = 'John', "last_name" = 'Smith'
        where "id" in ('0', '1', '2')
        returning *
      `);

      return response;
    });

    const Users = Mapper
      .knex(mocked)
      .table('users')
      .target(0, 1, 2);

    t.resolvesTo(
      Users.patch({ first_name: 'John', last_name: 'Smith' }),
      response,
      'returns rows'
    );
  });

  t.test('Mapper#patch() - receiving count', t => {

    const response = 3;

    t.plan(2);

    const mocked = MockedKnex('pg', query => {
      t.queriesEqual(query, `
        update "users"
        set "first_name" = 'John', "last_name" = 'Smith'
        where "id" in ('0', '1', '2')
        returning *
      `);

      return response;
    });

    const Users = Mapper
      .knex(mocked)
      .table('users')
      .target(0, 1, 2);

    t.resolvesTo(
      Users.patch({ first_name: 'John', last_name: 'Smith' }),
      response,
      'returns count'
    );
  });
});
