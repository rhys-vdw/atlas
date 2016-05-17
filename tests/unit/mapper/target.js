import test from 'tape';
import Mapper from '../../../lib/mapper';
import { UnidentifiableRecordError } from '../../../lib/errors';

test('Mapper - target', t => {

  t.test('Mapper#target() - one record with single primary key', t => {

    const Item = Mapper
      .table('items')
      .idAttribute('item_id')
      .target({ item_id: 'id_value' })
      .prepareFetch();


    t.queriesEqual(
      Item.toQueryBuilder(), `
        select "items".*
        from "items"
        where "items"."item_id" = 'id_value'
        limit 1
    `);

    t.equals(
      Item.requireState('isSingle'), true,
      '`isSingle` is set to `true`'
    );

    t.end();
  });

  t.test('Mapper#target() - records with single primary key', t => {

    const Items = Mapper
      .table('items')
      .idAttribute('item_id')
      .target({ item_id: 1 }, { item_id: 2 })
      .prepareFetch();

    t.queriesEqual(
      Items.toQueryBuilder(), `
      select "items".*
      from "items"
      where "items"."item_id" in (1, 2)
    `);

    t.equals(
      Items.requireState('isSingle'), false,
      '`isSingle` is set to `false`'
    );

    t.end();
  });

  t.test('Mapper#target() - one record with composite primary key', t => {

    const Items = Mapper
      .table('items')
      .idAttribute(['key_a', 'key_b'])
      .target({ key_a: 1, key_b: 2 })
      .prepareFetch();

    t.queriesEqual(
      Items.toQueryBuilder(), `
      select "items".*
      from "items"
      where "items"."key_a" = 1 and "items"."key_b" = 2
      limit 1
    `);

    t.equals(
      Items.requireState('isSingle'), true,
      '`isSingle` is set to `true`'
    );

    t.end();
  });

  t.test('Mapper#target() - records with composite primary key', t => {

    const Items = Mapper
      .table('items')
      .idAttribute(['key_a', 'key_b'])
      .target({ key_a: 1, key_b: 2 }, { key_a: 1, key_b: 3})
      .prepareFetch();

    t.queriesEqual(
      Items.toQueryBuilder(), `
        select "items".*
        from "items"
        where ("items"."key_a", "items"."key_b") in ((1, 2),(1, 3))
    `);

    t.equals(
      Items.requireState('isSingle'), false,
      '`isSingle` is set to `false`'
    );

    t.end();
  });

  t.test('Mapper#target() - no target', t => {

    const Items = Mapper
      .table('items')
      .idAttribute('the_id');

    t.throws(
      () => Items.target({}),
      UnidentifiableRecordError,
      'target({}) throws `UnidentifiableRecordError`'
    );

    function targetIsNoop(...args) {
      t.queriesEqual(
        Items.target(...args).toQueryBuilder(),
        `select * from "items" where 1 = 0`,
        `target(${args.join()}) is a noop`
      );
    }

    function targetIsSingle(...args) {
      t.equal(
        Items.target(...args).requireState('isSingle'), true,
        `target() is single`
      );
    }

    function targetIsNotSingle(...args) {
      t.equal(
        Items.target(...args).requireState('isSingle'), false,
        `target() is not single`
      );
    }

    targetIsNoop();
    targetIsSingle();

    targetIsNoop(null);
    targetIsSingle(null);

    targetIsNoop([]);
    targetIsNotSingle([]);

    targetIsNoop([null]);
    targetIsNotSingle([null]);

    t.end();
  });

});
