import test from '../../test';
import Mapper from '../../../lib/mapper';

test('Mapper.hasOne(Other).of()', t => {

  const Users = Mapper.table('users');
  const Avatars = Mapper.table('avatars');
  const UserAvatar = Users.hasOne(Avatars);

  t.queriesEqual(
    UserAvatar.of(1).prepareFetch().toQueryBuilder(),
    `select "avatars".* from "avatars" ` +
    `where "avatars"."user_id" = 1 limit 1`,
    'single parent fetch query'
  );

  t.queriesEqual(
    UserAvatar.of(1, 2).prepareFetch().toQueryBuilder(),
    `select "avatars".* from "avatars" ` +
    `where "avatars"."user_id" in (1, 2)`,
    'multiple parent fetch query'
  );

  t.deepEqual(
    UserAvatar.of({ id: 5 }).forge({ user_id: 2, url: 'some-value' }),
    { user_id: 5, url: 'some-value' },
    '`.forge()` overrides foreign key'
  );

  t.end();
});

test('Mapper.hasOne(Other, attributes).of()', t => {

  const Users = Mapper.table('users');
  const Avatars = Mapper.table('avatars');
  const CustomUserAvatar = Users.hasOne(Avatars, {
    avatars: 'owner_id', users: 'my_id'
  });

  t.queriesEqual(
    CustomUserAvatar.of({ my_id: 42 }).prepareFetch().toQueryBuilder(),
    `select "avatars".* from "avatars" ` +
    `where "avatars"."owner_id" = 42 limit 1`,
    'single parent fetch query - custom attributes'
  );

  t.deepEqual(
    CustomUserAvatar.of({ my_id: 5 }).forge({ owner_id: 2, url: 'some-value' }),
    { owner_id: 5, url: 'some-value' },
    '`.forge()` overrides foreign key - custom attributes'
  );

  t.end();
});

test('Mapper.hasMany().of()', t => {

  const Users = Mapper.table('users');
  const Images = Mapper.table('images');
  const UserImages = Users.hasMany(Images);

  t.queriesEqual(
    UserImages.of(1).prepareFetch().toQueryBuilder(),
    `select "images".* from "images" ` +
    `where "images"."user_id" = 1`,
    'single parent fetch query'
  );

  t.queriesEqual(
    UserImages.of(1, 2).prepareFetch().toQueryBuilder(),
    `select "images".* from "images" ` +
    `where "images"."user_id" in (1, 2)`,
    'multiple parent fetch query'
  );

  t.deepEqual(
    UserImages.of({ id: 5 }).forge({ user_id: 2, url: 'some-value' }),
    { user_id: 5, url: 'some-value' },
    '`.forge()` overrides foreign key'
  );

  t.end();
});

test('Mapper.hasMany(Other, attributes).of()', t => {

  const Users = Mapper.table('users');
  const Images = Mapper.table('images');
  const CustomUserImages = Users.hasMany(Images, {
    images: 'owner_id', users: 'my_id'
  });

  t.queriesEqual(
    CustomUserImages.of({ my_id: 42 }).prepareFetch().toQueryBuilder(),
    `select "images".* from "images" ` +
    `where "images"."owner_id" = 42`,
    'single parent fetch query - custom attributes'
  );

  t.deepEqual(
    CustomUserImages.of({ my_id: 5 }).forge({ owner_id: 2, url: 'some-value' }),
    { owner_id: 5, url: 'some-value' },
    '`.forge()` overrides foreign key - custom attributes'
  );

  t.end();
});


test('Mapper.belongsTo(Other).of()', t => {

  const Users = Mapper.table('users');
  const Documents = Mapper.table('documents');
  const DocumentOwners = Documents.belongsTo(Users);

  const a = { user_id: 5 };
  const b = { user_id: 6 };

  t.queriesEqual(
    DocumentOwners.of(a).prepareFetch().toQueryBuilder(),
    `select "users".* from "users" ` +
    `where "users"."id" = 5 limit 1`,
    'single parent fetch query'
  );

  t.queriesEqual(
    DocumentOwners.of(a, b).prepareFetch().toQueryBuilder(),
    `select "users".* from "users" ` +
    `where "users"."id" in (5, 6)`,
    'single parent fetch query'
  );

  t.deepEqual(
    DocumentOwners.of(a).forge({ id: 2, name: 'bob' }),
    { id: 5, name: 'bob' },
    '`.forge()` overrides primary key'
  );

  t.end();
});

test('Mapper.belongsTo(Other, attributes).of()', t => {

  const Users = Mapper.table('users');
  const Documents = Mapper.table('documents');
  const CustomDocumentOwners = Documents.belongsTo(Users, {
    documents: 'owner_id', users: 'my_id'
  });

  t.queriesEqual(
    CustomDocumentOwners.of({ owner_id: 42 }).prepareFetch().toQueryBuilder(),
    `select "users".* from "users" ` +
    `where "users"."my_id" = 42 limit 1`,
    'single parent fetch query'
  );

  const attributes = { my_id: 2, name: 'bob' };
  t.deepEqual(
    CustomDocumentOwners.of({ owner_id: 5 }).forge(attributes),
    { my_id: 5, name: 'bob' },
    '`.forge()` overrides primary key - custom attributes'
  );

  t.end();
});

test('Mapper.belongsToMany(Mapper).through(Mapper)', t => {

  const Users = Mapper.table('users');
  const Groups = Mapper.table('groups');
  const Memberships = Mapper.table('groups_users');

  const GroupMembers = Groups.belongsToMany(Users).through(Memberships);

  t.queriesEqual(
    GroupMembers.of(5).prepareFetch().toQueryBuilder(),
    `select "users".* from "users"
    inner join "groups_users"
    on "users"."id" = "groups_users"."user_id"
    where "groups_users"."group_id" = 5`
  );

  // TODO: https://github.com/rhys-vdw/atlas/issues/85
  t.skip(
    GroupMembers.of(5).forge({ name: 'Bob' }),
    { name: 'Bob', groups_users: { group_id: 5 } }
  );

  t.end();
});

test('Mapper.belongsToMany(Mapper, attributes).through()', t => {

  const Users = Mapper.table('users');
  const Groups = Mapper.table('groups');
  const Memberships = Mapper.table('groups_users');

  const GroupMembers = Groups
    .belongsToMany(Users, { groups: 'g_id', users: 'u_id' })
    .through(Memberships.many('user_u_id'))
    .many('group_g_id');

  t.queriesEqual(
    GroupMembers.of({ g_id: 5 }).prepareFetch().toQueryBuilder(),
    `select "users".* from "users"
    inner join "groups_users"
    on "users"."u_id" = "groups_users"."user_u_id"
    where "groups_users"."group_g_id" = 5`
  );

  t.end();
});
