import test from 'tape';
import Promise from 'bluebird';

function usersTable(users) {
  users.integer('id');
  users.string('name');
}

function avatarsTable(avatars) {
  avatars.integer('id');
  avatars.integer('user_id');
  avatars.string('image_path');
}

export default function(atlas) {

  const Mapper = atlas('Mapper');
  const { knex, related } = atlas;

  test('Mapper - relations - HasOne', t => {

    t.databaseTest('`Mapper#relation()`', knex, {
      users: usersTable, avatars: avatarsTable
    }, st => {

      const Avatars = Mapper.table('avatars');

      const Users = Mapper.table('users').relations({
        avatar: m => m.hasOne(Avatars, { avatars: 'user_id' })
      });

      return Promise.join(
        knex('users').insert([
          { id: 1, name: 'Dean' },
          { id: 2, name: 'Sarah' },
          { id: 3, name: 'Baz' }
        ]),
        knex('avatars').insert([
          { id: 10, user_id: 1, image_path: './dean.jpg' },
          { id: 11, user_id: 3, image_path: './bazza.jpg' },
          { id: 12, user_id: 2, image_path: './sarah.jpg' },
        ])
      ).then(() => {

        return Promise.join(
          st.resolvesToDeep(
            Users.relation('avatar').of(1).fetch(),
            { id: 10, user_id: 1, image_path: './dean.jpg' },
            `Mapper#relation(relation).of(id) resolves correctly`
          ),
          st.resolvesToDeep(
            Users.relation('avatar').of({ id: 2, name: 'Sarah' }).fetch(),
            { id: 12, user_id: 2, image_path: './sarah.jpg' },
            `Mapper#relation(relation).of({id}) resolves correctly`
          ),
          st.resolvesToDeep(
            Users.relation('avatar').of(1, 3).fetch(), [
              { id: 10, user_id: 1, image_path: './dean.jpg' },
              { id: 11, user_id: 3, image_path: './bazza.jpg' },
            ], `Mapper#relation(relation).of(id, id) resolves correctly`
          ),
          st.resolvesToDeep(
            Users.relation('avatar').of([1, 3]).fetch(), [
              { id: 10, user_id: 1, image_path: './dean.jpg' },
              { id: 11, user_id: 3, image_path: './bazza.jpg' },
            ], `Mapper#relation(relation).of([id, id]) resolves correctly`
          ),
          st.resolvesTo(
            Users.relation('avatar').of({ id: 4 }).fetch(),
            null,
            `Mapper#relation(relation).of({id}) resolves to null if none found`
          ),
          st.resolvesToDeep(
            Users.relation('avatar').of([{ id: 4 }, { id: 6 }]).fetch(),
            [],
            `Mapper#relation(relation).of([{id}, {id}]) resolves to [] if none ` +
            `found`
          )
        );
      });
    });

    t.databaseTest('`Mapper#load()`', knex, {
      avatars: avatarsTable
    }, st => {

      const Avatars = Mapper.table('avatars');

      const Users = Mapper.table('users').relations({
        avatar: m => m.hasOne(Avatars, { avatars: 'user_id' })
      });

      return knex('avatars').insert([
        { id: 10, user_id: 1, image_path: './dean.jpg' },
        { id: 11, user_id: 3, image_path: './bazza.jpg' },
        { id: 12, user_id: 2, image_path: './sarah.jpg' },
      ]).then(() => {

        const dean = { id: 1, name: 'dean' };
        const sarah = { id: 2, name: 'Sarah' };
        const baz = { id: 3, name: 'Baz' };
        const other = { id: 4, name: 'Other' };

        return Promise.join(
          st.resolvesToDeep(
            Users.load('avatar').into(dean),
            { id: 1, name: 'dean', avatar:
              { id: 10, user_id: 1, image_path: './dean.jpg' }
            },
            'loads into single record'
          ),
          st.resolvesToDeep(
            Users.load('avatar').into(sarah, baz), [
              { id: 2, name: 'Sarah', avatar:
                { id: 12, user_id: 2, image_path: './sarah.jpg' }
              }, { id: 3, name: 'Baz', avatar:
                { id: 11, user_id: 3, image_path: './bazza.jpg' }
              }
            ], 'loads into multiple records'
          ),
          st.resolvesToDeep(
            Users.load('avatar').into(dean, other), [
              { id: 1, name: 'dean', avatar:
                { id: 10, user_id: 1, image_path: './dean.jpg' }
              }, { id: 4, name: 'Other', avatar: null }
            ], 'loads null into one record and null into another'
          )
        )
      });
    });

    t.databaseTest('`Mapper#with()`', knex, {
      users: usersTable, avatars: avatarsTable
    }, st => {

      const Avatars = Mapper.table('avatars');

      const Users = Mapper.table('users').relations({
        avatar: m => m.hasOne(Avatars, { avatars: 'user_id' })
      });

      return knex('avatars').insert([
        { id: 10, user_id: 1, image_path: './dean.jpg' },
        { id: 11, user_id: 3, image_path: './bazza.jpg' },
        { id: 12, user_id: 2, image_path: './sarah.jpg' },
      ]).then(() => knex('users').insert([
        { id: 1, name: 'Dean' },
        { id: 2, name: 'Sarah' },
        { id: 3, name: 'Baz' },
        { id: 4, name: 'Other guy' }
      ])).then(() => {

        return st.resolvesToDeep(
          Users.with('avatar').fetch(), [
            { id: 1, name: 'Dean', avatar:
              { id: 10, user_id: 1, image_path: './dean.jpg' }
            },
            { id: 2, name: 'Sarah', avatar:
              { id: 12, user_id: 2, image_path: './sarah.jpg' }
            },
            { id: 3, name: 'Baz', avatar:
              { id: 11, user_id: 3, image_path: './bazza.jpg' }
            },
            { id: 4, name: 'Other guy', avatar: null }
          ], 'fetches records with related models'
        );
      });

    });

  });
}
