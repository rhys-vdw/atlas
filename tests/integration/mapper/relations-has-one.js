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
  const { knex, relations: { hasOne } } = atlas;

  test('Mapper - relations - HasOne', t => {

    t.databaseTest('`Mapper#related()`', knex, {
      users: usersTable, avatars: avatarsTable
    }, st => {

      const Avatars = Mapper.table('avatars');

      const Users = Mapper.table('users').relations({
        avatar: hasOne(Avatars)
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
            Users.related('avatar', 1).fetch(),
            { id: 10, user_id: 1, image_path: './dean.jpg' },
            `Mapper#related(relation, id) resolves correctly`
          ),
          st.resolvesToDeep(
            Users.related('avatar', { id: 2, name: 'Sarah' }).fetch(),
            { id: 12, user_id: 2, image_path: './sarah.jpg' },
            `Mapper#related(relation, {id}) resolves correctly`
          ),
          st.resolvesToDeep(
            Users.related('avatar', 1, 3).fetch(), [
              { id: 10, user_id: 1, image_path: './dean.jpg' },
              { id: 11, user_id: 3, image_path: './bazza.jpg' },
            ], `Mapper#related(relation, id, id) resolves correctly`
          ),
          st.resolvesToDeep(
            Users.related('avatar', [1, 3]).fetch(), [
              { id: 10, user_id: 1, image_path: './dean.jpg' },
              { id: 11, user_id: 3, image_path: './bazza.jpg' },
            ], `Mapper#related(relation, [id, id]) resolves correctly`
          ),
          st.resolvesTo(
            Users.related('avatar', { id: 4 }).fetch(),
            null,
            `Mapper#related(relation, {id}) resolves to null if none found`
          ),
          st.resolvesToDeep(
            Users.related('avatar', [{ id: 4 }, { id: 6 }]).fetch(),
            [],
            `Mapper#related(relation, [{id}, {id}]) resolves to [] if none ` +
            `found`
          )
        );
      });
    });

    t.databaseTest('`Mapper#loadInto()`', knex, {
      avatars: avatarsTable
    }, st => {

      const Avatars = Mapper.table('avatars');

      const Users = Mapper.table('users').relations({
        avatar: hasOne(Avatars)
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
            Users.loadInto(dean, 'avatar'),
            { id: 1, name: 'dean', avatar:
              { id: 10, user_id: 1, image_path: './dean.jpg' }
            },
            'loads into single record'
          ),
          st.resolvesToDeep(
            Users.loadInto([sarah, baz], 'avatar'), [
              { id: 2, name: 'Sarah', avatar:
                { id: 12, user_id: 2, image_path: './sarah.jpg' }
              }, { id: 3, name: 'Baz', avatar:
                { id: 11, user_id: 3, image_path: './bazza.jpg' }
              }
            ], 'loads into multiple records'
          ),
          st.resolvesToDeep(
            Users.loadInto([dean, other], 'avatar'), [
              { id: 1, name: 'dean', avatar:
                { id: 10, user_id: 1, image_path: './dean.jpg' }
              }, { id: 4, name: 'Other', avatar: null }
            ], 'loads null into one record and null into another'
          )
        );
      });
    });

    t.databaseTest('`Mapper#withRelated()`', knex, {
      users: usersTable, avatars: avatarsTable
    }, st => {

      const Avatars = Mapper.table('avatars');

      const Users = Mapper.table('users').relations({
        avatar: hasOne(Avatars)
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
          Users.withRelated('avatar').fetch(), [
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
