import test from 'tape';
import mapper from '../../../lib/mapper';
import { NotFoundError } from '../../../lib/errors';

test('Mapper', t => {

  t.test('Mapper#destroyAll() - no arguments', t => {
    const destroyMapper = mapper.table('table').prepareDestroyAll();
    const queryBuilder = destroyMapper.toQueryBuilder();
    const result = destroyMapper._handleDestroyResponse({
      queryBuilder, response: 5
    });

    t.queriesEqual(queryBuilder, `delete from "table"`);
    t.equal(result, 5, 'resolves to deleted count');

    t.end();
  });

  t.test('Mapper#prepareDestroy() - single ID value', t => {
    t.throws(() =>
      mapper.table('table').prepareDestroy(),
      TypeError,
      `throws TypeError with no arguments`
    );
    t.end();
  });

  t.test('Mapper#destroy() - single ID value', t => {

    const destroyMapper = mapper
      .table('table')
      .prepareDestroy(5);

    const queryBuilder = destroyMapper.toQueryBuilder();
    const result = destroyMapper._handleDestroyResponse({
      queryBuilder, response: 1
    });

    t.queriesEqual(
      queryBuilder,
      `delete from "table" where "table"."id" = 5`
    );
    t.equal(result, 1, 'resolves to deleted count');

    t.doesNotThrow(
      () => destroyMapper._handleDestroyResponse({
        queryBuilder, response: 0
      }),
      'does not throw when not required and no rows changed'
    );

    t.throws(
      () => destroyMapper.require()._handleDestroyResponse({
        queryBuilder, response: 0
      }),
      NotFoundError,
      'throws `NotFoundError` when required and no rows changed'
    );
    t.end();
  });

});
