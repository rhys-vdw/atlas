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

  test('Mapper - relations', t => {

    t.databaseTest('`Mapper#related()`', knex, {
      users: usersTable, avatars: avatarsTable
    }, st => {

      st.plan(4);

      const Avatars = Mapper.table('avatars');

      const Users = Mapper.table('users').relations({
        avatar: hasOne(Avatars)
      });

      return Promise.join(
        knex('users').insert([
          { id: 1, name: 'Dean' },
          { id: 2, name: 'Sarah' },
          { id: 3, name: 'Baz' },
        ]),
        knex('avatars').insert([
          { id: 10, user_id: 1, image_path: './dean.jpg' },
          { id: 11, user_id: 3, image_path: './bazza.jpg' },
          { id: 12, user_id: 2, image_path: './sarah.jpg' },
          { id: 99, user_id: null, image_path: './NOBODY.jpg' },
        ])
      ).then(() => {

        st.resolvesToDeep(
          Users.related('avatar', 1).fetch(),
          { id: 10, user_id: 1, image_path: './dean.jpg' },
          `Mapper#related(relation, id) resolves correctly`
        );

        st.resolvesToDeep(
          Users.related('avatar', { id: 2, name: 'Sarah' }).fetch(),
          { id: 12, user_id: 2, image_path: './sarah.jpg' },
          `Mapper#related(relation, record) resolves correctly`
        );

        st.resolvesToDeep(
          Users.related('avatar', 1, 3).fetch(), [
            { id: 10, user_id: 1, image_path: './dean.jpg' },
            { id: 11, user_id: 3, image_path: './bazza.jpg' },
          ], `Mapper#related(relation, id, id) resolves correctly`
        );

        st.resolvesToDeep(
          Users.related('avatar', [1, 3]).fetch(), [
            { id: 10, user_id: 1, image_path: './dean.jpg' },
            { id: 11, user_id: 3, image_path: './bazza.jpg' },
          ], `Mapper#related(relation, [id, id]) resolves correctly`
        );

      });

    });

    t.end();
  });
}
