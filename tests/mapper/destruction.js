import test from 'tape';
import mapper from '../../lib/mapper';
import { NotFoundError } from '../../lib/errors';

test('Mapper', t => {

  t.test('Mapper#destroy() - no arguments', t => {
    const TABLE = 'TABLE';

    const destroyMapper = mapper.table(TABLE).prepareDestroy();
    const queryBuilder = destroyMapper.toQueryBuilder();
    const result = destroyMapper._handleDestroyResponse({
      queryBuilder, response: 5
    });

    t.queriesEqual(queryBuilder, `delete from "${TABLE}"`);
    t.equal(result, 5, 'resolves to deleted count');

    t.end();
  });

  t.test('Mapper#destroy() - single ID value', t => {

    const destroyMapper = mapper
      .table('table')
      .require()
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

    t.throws(
      () => destroyMapper
        .require()
        ._handleDestroyResponse({
          queryBuilder, response: 0
        })
      , NotFoundError,
      'throws `NotFoundError` when required and no rows changed'
    );
    t.end();
  });

});
