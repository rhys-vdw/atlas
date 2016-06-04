import test from 'tape';
import Mapper from '../../../lib/mapper';

import HasOne from '../../../lib/relations/has-one';

test('== HasOne ==', t => {

  t.test('new HasOne()', t => {

    const Self = Mapper.table('selves');
    const Other = Mapper.table('others');

    const hasOneCustom = new HasOne(Self, Other, {
      selfKey: 'self_key', otherRef: 'other_ref'
    });

    t.equal(
      hasOneCustom.selfAttribute, 'self_key',
      'stores custom `selfAttribute` correctly'
    );

    t.equal(
      hasOneCustom.otherAttribute, 'other_ref',
      'stores custom `otherAttribute` correctly'
    );

    const hasOneDefault = new HasOne(Self, Other);

    t.equal(
      hasOneDefault.selfAttribute, 'id',
      'defaults `selfAttribute` to id attribute'
    );

    t.equal(
      hasOneDefault.otherAttribute, 'self_id',
      'defaults `otherAttribute` to {singular table name}_{id attribute}'
    );

    t.end();
  });

  t.test('HasOne#constructor - bad config', t => {
    const As = Mapper.table('as');
    const Bs = Mapper.table('bs');

    t.throws(
      () => new HasOne(As, Bs, { selfKey: 'id', otherRef: ['a', 'b'] }),
      TypeError,
      'throws error when keys are mismatched'
    );

    t.end();
  });

  t.test('HasOne#of() - single target', t => {
    const LoginRecords = Mapper.table('login_records');
    const User = Mapper.table('users').idAttribute('id_code');

    const user = { id_code: 6 };
    const Login = new HasOne(User, LoginRecords).of(user);

    t.equal(Login.requireState('isSingle'), true, 'isSingle');

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

  t.test('HasOne#of() - multiple targets', t => {
    const LoginRecords = Mapper.table('login_records');
    const User = Mapper.table('users').idAttribute('id_code');

    const users = [{ id_code: 6 }, { id_code: 4 }];
    const Login = new HasOne(User, LoginRecords).of(users);

    t.equal(Login.requireState('isSingle'), false, '!isSingle');

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


  t.test('HasOne#of() - single target with composite key', t => {
    const Foos = Mapper.table('foos').idAttribute(['pk_a', 'pk_b']);
    const Bars = Mapper.table('bars');

    const foo = { pk_a: 1, pk_b: 2 };
    const Bar = new HasOne(Foos, Bars).of(foo);

    t.equal(Bar.requireState('isSingle'), true, 'isSingle');

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

  t.test('HasOne#of() - multiple targets with composite key', t => {
    const Foos = Mapper.table('foos').idAttribute(['pk_a', 'pk_b']);
    const Bars = Mapper.table('bars');

    const foo = [{ pk_a: 1, pk_b: 2 }, { pk_a: 4, pk_b: 5 }];
    const Bar = new HasOne(Foos, Bars).of(foo);

    t.equal(Bar.requireState('isSingle'), false, 'isSingle');

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
    const Self = Mapper.table('selves').idAttribute(['id_a', 'id_b']);
    const Other = Mapper;
    const hasOne = new HasOne(Self, Other);

    const selves = [
      { id_a: 1, id_b: 2 },
      { id_a: 3, id_b: 2 }
    ];
    const others = [
      { index: 0, self_id_a: 3, self_id_b: 2 },
      { index: 1, self_id_a: 1, self_id_b: 2 },
    ];

    const related = hasOne.mapRelated(selves, others);

    t.deepEqual(selves[0], { id_a: 1, id_b: 2 },
      `original record is unchanged`
    );
    t.equal(
      related[0], others[1],
      `assigns related to record[0] correctly`
    );
    t.deepEqual(
      related[0], { index: 1, self_id_a: 1, self_id_b: 2 },
      `record[0] related is correct`
    );

    t.deepEqual(selves[1], { id_a: 3, id_b: 2 },
      `original record is unchanged`
    );
    t.equal(
      related[1], others[0],
      `assigns related to record[1] correctly`
    );
    t.deepEqual(
      related[1], { index: 0, self_id_a: 3, self_id_b: 2 },
      `record[1] related is correct`
    );

    t.end();
  });

  t.end();
});
