import test from 'tape';
import Promise from 'bluebird';

function usersTable(users) {
  users.integer('id');
  users.string('name');
}

function postsTable(posts) {
  posts.integer('id');
  posts.integer('author_id');
  posts.string('message');
}

export default function(atlas) {

  const Mapper = atlas('Mapper');
  const { knex } = atlas;
  const { belongsTo } = atlas.relations;

  test('Mapper - relations - belongsTo', t => {

    t.databaseTest('`Mapper#related()`', knex, {
      users: usersTable
    }, st => {

      const Users = Mapper.table('users');

      const Posts = Mapper.table('posts').relations({
        author: belongsTo(Users, { selfRef: 'author_id' })
      });

      return knex('users').insert([
        { id: 1, name: 'Dean' },
        { id: 2, name: 'Sarah' },
        { id: 3, name: 'Baz' }
      ]).then(() => Promise.join(
        st.resolvesToDeep(
          Posts.related('author', 1).fetch(),
          { id: 1, name: 'Dean' },
          `Mapper#related(relation, id) resolves correctly`
        ),
        st.resolvesToDeep(
          Posts.related('author', { author_id: 2 }).fetch(),
          { id: 2, name: 'Sarah' },
          `Mapper#related(relation, {id}) resolves correctly`
        ),
        st.resolvesToDeep(
          Posts.related('author', 1, 3).fetch(), [
            { id: 1, name: 'Dean' },
            { id: 3, name: 'Baz' }
          ], `Mapper#related(relation, id, id) resolves correctly`
        ),
        st.resolvesToDeep(
          Posts.related('author', [1, 3]).fetch(), [
            { id: 1, name: 'Dean' },
            { id: 3, name: 'Baz' }
          ], `Mapper#related(relation, [id, id]) resolves correctly`
        ),
        st.resolvesTo(
          Posts.related('author', { author_id: 4 }).fetch(),
          null,
          `Mapper#related(relation, {id}) resolves to null if none found`
        ),
        st.resolvesToDeep(
          Posts.related('author', [{ author_id: 4 }, { author_id: 6 }]).fetch(),
          [],
          `Mapper#related(relation, [{id}, {id}]) resolves to [] if none found`
        ))
      );

    });

    t.databaseTest('`Mapper#loadInto()`', knex, { users: usersTable }, st => {

      const Users = Mapper.table('users');

      const Posts = Mapper.table('posts').relations({
        author: belongsTo(Users, { selfRef: 'author_id' })
      });

      return knex('users').insert([
        { id: 1, name: 'Dean' },
        { id: 2, name: 'Sarah' },
        { id: 3, name: 'Baz' }
      ]).then(() => {

        const deanA = { id: 10, author_id: 1, message: `Dean's first post` };
        const barryA = { id: 11, author_id: 3, message: `Barry's first post` };
        const sarahA = { id: 12, author_id: 2, message: `Hello I'm Sarah` };
        const deanB = { id: 13, author_id: 1, message: `Dean again` };
        const noAuthor = { id: 15, author_id: null, message: `anonymous` };
        const deletedAuthor = { id: 16, author_id: 99, message: `goodbye` };

        return Promise.join(
          st.resolvesToDeep(
            Posts.loadInto(deanA, 'author'),
            { id: 10, author_id: 1, message: `Dean's first post`, author:
              { id: 1, name: 'Dean' }
            },
            'loads into single record'
          ),
          st.resolvesToDeep(
            Posts.loadInto([sarahA, barryA], 'author'), [
              { id: 12, author_id: 2, message: `Hello I'm Sarah`, author:
                { id: 2, name: 'Sarah' }
              },
              { id: 11, author_id: 3, message: `Barry's first post`, author:
                { id: 3, name: 'Baz' }
              },
            ], 'loads into multiple records'
          ),
          st.resolvesToDeep(
            Posts.loadInto([deanA, deanB], 'author'), [
              { id: 10, author_id: 1, message: `Dean's first post`, author:
                { id: 1, name: 'Dean' }
              },
              { id: 13, author_id: 1, message: `Dean again`, author:
                { id: 1, name: 'Dean' }
              }
            ], 'loads the same author into two records'
          ),
          st.resolvesToDeep(
            Posts.loadInto([deanB, deletedAuthor], 'author'), [
              { id: 13, author_id: 1, message: `Dean again`, author:
                { id: 1, name: 'Dean' }
              },
              { id: 16, author_id: 99, message: `goodbye`, author: null }
            ], 'loads related into one record and null into another'
          ),
          st.resolvesToDeep(
            Posts.loadInto(noAuthor, 'author'),
            { id: 15, author_id: null, message: `anonymous`, author: null },
            'loads relation as null when foreign key is null'
          )
        );
      });
    });

    t.databaseTest('`Mapper#withRelated()`', knex, {
      users: usersTable, posts: postsTable
    }, st => {

      const Users = Mapper.table('users');

      const Posts = Mapper.table('posts').relations({
        author: belongsTo(Users, { selfRef: 'author_id' })
      });

      return knex('posts').insert([
        { id: 10, author_id: 1, message: `Dean's first post` },
        { id: 11, author_id: 3, message: `Barry's first post` },
        { id: 12, author_id: 2, message: `Hello I'm Sarah` },
        { id: 13, author_id: 1, message: `Dean again` },
        { id: 14, author_id: 3, message: `Bazza again` },
        { id: 15, author_id: null, message: `anonymous` },
        { id: 16, author_id: 99, message: `goodbye` },
      ]).then(() => knex('users').insert([
        { id: 1, name: 'Dean' },
        { id: 2, name: 'Sarah' },
        { id: 3, name: 'Baz' },
      ])).then(() => {

        return st.resolvesToDeep(
          Posts.withRelated('author').fetch(), [
            { id: 10, author_id: 1, message: `Dean's first post` , author:
              { id: 1, name: 'Dean' }
            },
            { id: 11, author_id: 3, message: `Barry's first post` , author:
              { id: 3, name: 'Baz' }
            },
            { id: 12, author_id: 2, message: `Hello I'm Sarah` , author:
              { id: 2, name: 'Sarah' }
            },
            { id: 13, author_id: 1, message: `Dean again` , author:
              { id: 1, name: 'Dean' }
            },
            { id: 14, author_id: 3, message: `Bazza again` , author:
              { id: 3, name: 'Baz' }
            },
            { id: 15, author_id: null, message: `anonymous` , author: null },
            { id: 16, author_id: 99, message: `goodbye` , author: null },
          ], 'fetches records with related models'
        );
      });

    });
  });
}
