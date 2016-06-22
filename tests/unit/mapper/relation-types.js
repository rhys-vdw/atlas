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
    `select distinct "avatars".* from "avatars" ` +
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

