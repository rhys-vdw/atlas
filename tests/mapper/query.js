import test from 'tape';
import Knex from 'knex';

import Mapper from '../../lib/mapper';

test('Mapper - query', t => {

  t.test('Mapper#query', t => {

    const TABLE = 'TABLE';
    const COLUMN_A = 'COLUMN_A';
    const COLUMN_VALUE_A = 'COLUMN_VALUE_A';
    const COLUMN_B = 'COLUMN_B';
    const COLUMN_VALUE_B = 'COLUMN_VALUE_B';

    const mutable = Mapper.knex(new Knex({})).asMutable();

    const withQuery = mutable
      .table(TABLE)
      .query('where', COLUMN_A, COLUMN_VALUE_A);

    t.equal(
      mutable, withQuery,
      '`query` on a mutable instance does not return a copy'
    );

    const immutable = mutable.asImmutable();
    const immutableWithQuery = immutable.query('where', COLUMN_B, COLUMN_VALUE_B);

    t.notEqual(
      immutable, immutableWithQuery,
      '`query` returns a copy on an immutable instance that was ' +
      'previously mutable...'
    );

    t.queriesEqual(
      immutableWithQuery.toQueryBuilder(), `
        select * from "${TABLE}"
        where "${COLUMN_A}" = '${COLUMN_VALUE_A}'
        and "${COLUMN_B}" = '${COLUMN_VALUE_B}'
      `,
      '...new instance query is set correctly...'
    );

    t.queriesEqual(
      immutable.toQueryBuilder(), `
        select * from "${TABLE}"
        where "${COLUMN_A}" = '${COLUMN_VALUE_A}'
      `,
      '...previous instance remains unchanged.'
    );

    t.end();
  });

  t.test('Mapper#knex()', t => {

    const knexA = new Knex({});
    const knexB = new Knex({});
    const TABLE = 'TABLE';

    const mapperA = Mapper.knex(knexA).table(TABLE);

    const mapperAWithQuery = mapperA.query('where', 'x', 5);

    t.equal(
      mapperAWithQuery.toQueryBuilder().client, knexA.client,
      '`QueryBuilder` has correct client'
    );

    const mapperB = mapperAWithQuery.knex(knexB);

    t.equal(
      mapperB.toQueryBuilder().client, knexB.client,
      'Reassigns client on existing query'
    );

    t.end();
  });

  t.test('Mapper#toQueryBuilder(), Mapper#table()', t => {

    const TABLE = 'TABLE';
    const knex = Knex({});

    const configured = Mapper.knex(knex).table(TABLE);
    const queryBuilder = configured.toQueryBuilder();

    t.equal(
      queryBuilder.client, knex.client,
      'returns `QueryBuilder` with correct client'
    );

    t.equal(
      queryBuilder.toString(),
      `select * from "${TABLE}"`,
      'generates query with correct table'
    );

    t.notEqual(
      queryBuilder, configured._query,
      'returns a copy of the stored `QueryBuilder`'
    );

    t.end();
  });

  t.end();
});
