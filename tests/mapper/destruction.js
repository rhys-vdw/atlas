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
    const TABLE = 'TABLE';
    const ID_ATTRIBUTE = 'ID_ATTRIBUTE';
    const ID_VALUE = 'ID_VALUE';

    const destroyMapper = mapper
      .table(TABLE)
      .idAttribute(ID_ATTRIBUTE)
      .require()
      .prepareDestroy(ID_VALUE);

    const queryBuilder = destroyMapper.toQueryBuilder();
    const result = destroyMapper._handleDestroyResponse({
      queryBuilder, response: 1
    });

    t.queriesEqual(
      queryBuilder,
      `delete from "${TABLE}" where "${ID_ATTRIBUTE}" = '${ID_VALUE}'`
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
