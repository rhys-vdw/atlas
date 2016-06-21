import test from '../../test';
import Mapper from '../../../lib/mapper';

test('Mapper#one()', t => {

  const Record = Mapper.table('records').one();

  t.equal(
    Record.state.isSingle, true,
    'is single'
  );
  t.equal(
    Record.state.relationAttribute, undefined,
    'leave relation attribute unset'
  );

  t.end();
});

test('Mapper#one(attribute)', t => {

  const Record = Mapper.table('records').one('test_attribute');

  t.equal(
    Record.state.isSingle, true,
    'is single'
  );
  t.equal(
    Record.state.relationAttribute, 'test_attribute',
    'sets relation attribute'
  );

  t.end();
});


test('Mapper#many()', t => {

  const Record = Mapper.table('records').many();

  t.equal(
    Record.state.isSingle, false,
    'is not single'
  );
  t.equal(
    Record.state.relationAttribute, undefined,
    'leave relation attribute unset'
  );

  t.end();
});

test('Mapper#many(attribute)', t => {

  const Record = Mapper.table('records').many('test_attribute');

  t.equal(
    Record.state.isSingle, false,
    'is not single'
  );
  t.equal(
    Record.state.relationAttribute, 'test_attribute',
    'sets relation attribute'
  );

  t.end();
});

test('Mapper#through - many-to-many', t => {

  const Users = Mapper.table('users');
  const Groups = Mapper.table('groups');
  const Memberships = Mapper.table('groups_users').as('memberships');

  const GroupsThroughMemberships = Users.one().to(
    Groups.through(g => g.one().to(Memberships.many()))
  );

  t.queriesEqual(
    GroupsThroughMemberships.prepareFetch().toQueryBuilder(), `
      select "groups".* from "groups"
      inner join "groups_users" as "memberships"
      on "groups"."id" = "memberships"."group_id"
    `,
    'joins with default attributes'
  );


  const GroupsThroughMembershipsCustom = Users.one().to(
    Groups.through(g => g.one('my_id').to(Memberships.many('my_group_id')))
  );

  t.queriesEqual(
    GroupsThroughMembershipsCustom.prepareFetch().toQueryBuilder(), `
      select "groups".* from "groups"
      inner join "groups_users" as "memberships"
      on "groups"."my_id" = "memberships"."my_group_id"
    `,
    'joins with custom attributes'
  );

  const UserGroups = Users.one().to(
    Groups.through(g => g.one().to(Memberships.many()))
  );

  t.queriesEqual(
    UserGroups.of(1).prepareFetch().toQueryBuilder(), `
      select "groups".* from "groups"
      inner join "groups_users" as "memberships"
      on "groups"."id" = "memberships"."group_id"
      where "memberships"."user_id" = 1
    `,
    '`.of(id)`'
  );

  t.queriesEqual(
    UserGroups.of(1, 2, 3).prepareFetch().toQueryBuilder(), `
      select "groups".* from "groups"
      inner join "groups_users" as "memberships"
      on "groups"."id" = "memberships"."group_id"
      where "memberships"."user_id" in (1, 2, 3)
    `,
    '`.of(...ids)`'
  );

  const UserGroupsCustom = Users.one().to(
    Groups.through(g => g.one('my_id').to(Memberships.many('my_group_id')))
      .many('my_user_id')
  );

  t.queriesEqual(
    UserGroupsCustom.of(1).prepareFetch().toQueryBuilder(), `
      select "groups".* from "groups"
      inner join "groups_users" as "memberships"
      on "groups"."my_id" = "memberships"."my_group_id"
      where "memberships"."my_user_id" = 1
    `,
    'uses custom attributes in join and relation'
  );


  t.end();
});

test('Mapper#getDefaultRelationAttribute', t => {

  const Lefts = Mapper.table('lefts').idAttribute('l_id');
  const Left = Lefts.single();
  const Rights = Mapper.table('rights').idAttribute('r_id');
  const Right = Rights.single();

  t.equal(
    Left.getDefaultRelationAttribute(Right), 'l_id',
    'one-to-one'
  );

  t.equal(
    Left.getDefaultRelationAttribute(Rights), 'l_id',
    'one-to-many'
  );

  t.equal(
    Lefts.getDefaultRelationAttribute(Right), 'right_r_id',
    'many-to-one'
  );

  t.equal(
    Left.getDefaultRelationAttribute(Right), 'l_id',
    'many-to-many'
  );

  t.end();
});

test('Mapper#getRelationAttribute', t => {

  const Lefts = Mapper.table('lefts').idAttribute('l_id');
  const Rights = Mapper.table('rights').idAttribute('r_id');

  t.throws(
    () => Lefts.getRelationAttribute(), TypeError,
    'should throw if no mapper is provided as an argument'
  );

  t.equal(
    Lefts.many().getRelationAttribute(Rights), 'l_id',
    'gets default relation attribute if none is set'
  );

  t.equal(
    Lefts.many('custom_attr').getRelationAttribute(Rights), 'custom_attr',
    'returns set attribute (if set)'
  );

  t.end();
});
