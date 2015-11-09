import test from 'tape';
import Mapper from '../../lib/mapper';
import identity from 'lodash/utility/identity';

import HasOne from '../../lib/relations/has-one';

test('== HasOne ==', t => {

  t.test('new HasOne()', t => {

    const Self = Mapper.table('selves');
    const Other = Mapper.table('others');
    const atlas = identity;

    const hasOneCustom = new HasOne(Other, {
      selfKey: 'self_key', otherRef: 'other_ref'
    }).initialize(Self);

    t.equal(
      hasOneCustom.getSelfKey(atlas), 'self_key',
      'stores custom `selfKey` correctly'
    );

    t.equal(
      hasOneCustom.getOtherRef(atlas), 'other_ref',
      'stores custom `otherRef` correctly'
    );

    const hasOneDefault = new HasOne(Other).initialize(Self);

    t.equal(
      hasOneDefault.getSelfKey(atlas), 'id',
      'defaults `selfKey` to id attribute'
    );

    t.equal(
      hasOneDefault.getOtherRef(atlas), 'self_id',
      'defaults `otherRef` to {singular table name}_{id attribute}'
    );

    t.end();
  });

  t.test('HasOne#toMapper() - bad config', t => {
    const atlas = identity;
    const As = Mapper.table('as');
    const Bs = Mapper.table('bs');
    const hasOne = new HasOne(Bs, { selfKey: 'id', otherRef: ['a', 'b'] })
      .initialize(As);

    t.throws(
      () => hasOne.toMapper(atlas, { id: 5 }),
      /Mismatched key types/,
      'throws error when keys are mismatched'
    );

    t.end();
  });

  t.test('HasOne#toMapper() - single target', t => {
    const atlas = identity;

    const LoginRecords = Mapper.table('login_records');
    const User = Mapper.table('users').idAttribute('id_code');

    const user = { id_code: 6 };
    const Login = new HasOne(LoginRecords)
      .initialize(User).toMapper(atlas, user);

    t.equal(Login.getOption('isSingle'), true, 'isSingle');

    t.deepEqual(
      Login.forge({ created_at: '<some date>' }),
      { user_id_code: 6, created_at: '<some date>' },
      'creates record with default foreign key'
    );

    t.queriesEqual(
      Login.prepareFetch().toQueryBuilder(), `
        select "login_records".*
        from "login_records"
        where "login_records"."user_id_code" = 6
        limit 1
      `
    );

    t.end();
  });

  t.test('HasOne#toMapper() - multiple targets', t => {
    const atlas = identity;

    const LoginRecords = Mapper.table('login_records');
    const User = Mapper.table('users').idAttribute('id_code');

    const users = [{ id_code: 6 }, { id_code: 4 }];
    const Login = new HasOne(LoginRecords)
      .initialize(User).toMapper(atlas, users);

    t.equal(Login.getOption('isSingle'), false, '!isSingle');

    t.deepEqual(
      Login.forge({ created_at: '<some date>' }),
      { created_at: '<some date>' },
      'does not assign a default key'
    );

    t.queriesEqual(
      Login.prepareFetch().toQueryBuilder(), `
        select "login_records".*
        from "login_records"
        where "login_records"."user_id_code" in (6, 4)
      `
    );

    t.end();
  });


  t.test('HasOne#toMapper() - single target with composite key', t => {
    const atlas = identity;

    const Foos = Mapper.table('foos').idAttribute(['pk_a', 'pk_b']);
    const Bars = Mapper.table('bars');

    const foo = { pk_a: 1, pk_b: 2 };
    const Bar = new HasOne(Bars)
      .initialize(Foos).toMapper(atlas, foo);

    t.equal(Bar.getOption('isSingle'), true, 'isSingle');

    t.deepEqual(
      Bar.forge({ field: 'value' }),
      { foo_pk_a: 1, foo_pk_b: 2, field: 'value' },
      'creates record with default foreign keys'
    );

    t.queriesEqual(
      Bar.prepareFetch().toQueryBuilder(), `
        select "bars".*
        from "bars"
        where "bars"."foo_pk_a" = 1 and "bars"."foo_pk_b" = 2
        limit 1
      `
    );

    t.end();
  });

  t.test('HasOne#toMapper() - multiple targets with composite key', t => {
    const atlas = identity;

    const Foos = Mapper.table('foos').idAttribute(['pk_a', 'pk_b']);
    const Bars = Mapper.table('bars');

    const foo = [{ pk_a: 1, pk_b: 2 }, { pk_a: 4, pk_b: 5 }];
    const Bar = new HasOne(Bars)
      .initialize(Foos).toMapper(atlas, foo);

    t.equal(Bar.getOption('isSingle'), false, 'isSingle');

    t.deepEqual(
      Bar.forge({ field: 'value' }),
      { field: 'value' },
      'creates record without default foreign keys'
    );

    t.queriesEqual(
      Bar.prepareFetch().toQueryBuilder(), `
        select "bars".*
        from "bars"
        where
          ("bars"."foo_pk_a", "bars"."foo_pk_b")
        in
          ((1, 2),(4, 5))
      `
    );
    t.end();
  });

  t.test('HasOne#assignRelated() - with composite key', t => {
    const atlas = identity;

    const Self = Mapper.table('selves').idAttribute(['id_a', 'id_b']);
    const Other = Mapper;
    const hasOne = new HasOne(Other)
      .initialize(Self);

    const selves = [
      { id_a: 1, id_b: 2 },
      { id_a: 3, id_b: 2 }
    ];
    const others = [
      { index: 0, self_id_a: 3, self_id_b: 2 },
      { index: 1, self_id_a: 1, self_id_b: 2 },
    ];

    hasOne.assignRelated(atlas, 'other', selves, others);

    t.equal(
      selves[0].other, others[1], `assigns related to record[0] correctly`
    );
    t.deepEqual(
      selves[0].other,
      { index: 1, self_id_a: 1, self_id_b: 2 },
      `record[0] related is correct`
    );

    t.equal(
      selves[1].other, others[0], `assigns related to record[1] correctly`
    );
    t.deepEqual(
      selves[1].other,
      { index: 0, self_id_a: 3, self_id_b: 2 },
      `record[1] related is correct`
    );

    t.end();
  });

  t.end();
});
