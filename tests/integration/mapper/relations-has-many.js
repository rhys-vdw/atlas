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
  const { hasMany } = atlas.relations;

  test('Mapper - relations - HasMany', t => {

    t.databaseTest('`Mapper#related()`', knex, { posts: postsTable }, st => {

      const Posts = Mapper.table('posts');

      const Users = Mapper.table('users').relations({
        posts: hasMany(Posts.query('orderBy', 'id'), { otherRef: 'author_id' })
      });

      return knex('posts').insert([
        { id: 10, author_id: 1, message: `Dean's first post` },
        { id: 11, author_id: 3, message: `Barry's first post` },
        { id: 12, author_id: 2, message: `Hello I'm Sarah` },
        { id: 13, author_id: 1, message: `Dean again` },
        { id: 14, author_id: 3, message: `Bazza again` },
      ]).then(() => {

        return Promise.join(
          st.resolvesToDeep(
            Users.related('posts', 1).fetch(), [
              { id: 10, author_id: 1, message: `Dean's first post` },
              { id: 13, author_id: 1, message: `Dean again` },
            ],
            `Mapper#related(relation, id) resolves correctly`
          ),
          st.resolvesToDeep(
            Users.related('posts', { id: 2, name: 'Sarah' }).fetch(), [
              { id: 12, author_id: 2, message: `Hello I'm Sarah` },
            ], `Mapper#related(relation, {id}) resolves correctly`
          ),
          st.resolvesToDeep(
            Users.related('posts', 1, 3).fetch(), [
              { id: 10, author_id: 1, message: `Dean's first post` },
              { id: 11, author_id: 3, message: `Barry's first post` },
              { id: 13, author_id: 1, message: `Dean again` },
              { id: 14, author_id: 3, message: `Bazza again` },
            ], `Mapper#related(relation, id, id) resolves correctly`
          ),
          st.resolvesToDeep(
            Users.related('posts', [1, 3]).fetch(), [
              { id: 10, author_id: 1, message: `Dean's first post` },
              { id: 11, author_id: 3, message: `Barry's first post` },
              { id: 13, author_id: 1, message: `Dean again` },
              { id: 14, author_id: 3, message: `Bazza again` },
            ], `Mapper#related(relation, [id, id]) resolves correctly`
          ),
          st.resolvesToDeep(
            Users.related('posts', { id: 4 }).fetch(),
            [],
            `Mapper#related(relation, {id}) resolves to [] if none found`
          ),
          st.resolvesToDeep(
            Users.related('posts', [{ id: 4 }, { id: 6 }]).fetch(),
            [],
            `Mapper#related(relation, [{id}, {id}]) resolves to [] if none found`
          )
        );
      });
    });

    t.databaseTest('`Mapper#loadInto()`', knex, { posts: postsTable }, st => {

      const Posts = Mapper.table('posts');

      const Users = Mapper.table('users').relations({
        posts: hasMany(Posts.query('orderBy', 'id'), { otherRef: 'author_id' })
      });

      return knex('posts').insert([
        { id: 10, author_id: 1, message: `Dean's first post` },
        { id: 11, author_id: 3, message: `Barry's first post` },
        { id: 12, author_id: 2, message: `Hello I'm Sarah` },
        { id: 13, author_id: 1, message: `Dean again` },
        { id: 14, author_id: 3, message: `Bazza again` },
      ]).then(() => {

        const dean = { id: 1, name: 'dean' }
        const sarah = { id: 2, name: 'Sarah' };
        const baz = { id: 3, name: 'Baz' };
        const other = { id: 4, name: 'Other' };

        return Promise.join(
          st.resolvesToDeep(
            Users.loadInto(dean, 'posts'),
            { id: 1, name: 'dean', posts: [
                { id: 10, author_id: 1, message: `Dean's first post` },
                { id: 13, author_id: 1, message: `Dean again` },
            ] },
            'loads into single record'
          ),
          st.resolvesToDeep(
            Users.loadInto([sarah, baz], 'posts'), [
              { id: 2, name: 'Sarah', posts: [
                { id: 12, author_id: 2, message: `Hello I'm Sarah` },
              ] },
              { id: 3, name: 'Baz', posts: [
                { id: 11, author_id: 3, message: `Barry's first post` },
                { id: 14, author_id: 3, message: `Bazza again` },
              ] }
            ], 'loads into multiple records'
          ),
          st.resolvesToDeep(
            Users.loadInto([dean, other], 'posts'), [
              { id: 1, name: 'dean', posts: [
                { id: 10, author_id: 1, message: `Dean's first post` },
                { id: 13, author_id: 1, message: `Dean again` },
              ] },
              { id: 4, name: 'Other', posts: [] }
            ], 'loads related into one record and [] into another'
          )
        );
      });
    });

    t.databaseTest('`Mapper#withRelated()`', knex, {
      users: usersTable, posts: postsTable
    }, st => {

      const Posts = Mapper.table('posts');

      const Users = Mapper.table('users').relations({
        posts: hasMany(Posts.query('orderBy', 'id'), { otherRef: 'author_id' })
      });

      return knex('posts').insert([
        { id: 10, author_id: 1, message: `Dean's first post` },
        { id: 11, author_id: 3, message: `Barry's first post` },
        { id: 12, author_id: 2, message: `Hello I'm Sarah` },
        { id: 13, author_id: 1, message: `Dean again` },
        { id: 14, author_id: 3, message: `Bazza again` },
      ]).then(() => knex('users').insert([
        { id: 1, name: 'Dean' },
        { id: 2, name: 'Sarah' },
        { id: 3, name: 'Baz' },
        { id: 4, name: 'Other guy' }
      ])).then(() => {

        return st.resolvesToDeep(
          Users.query('orderBy', 'id').withRelated('posts').fetch(), [
            { id: 1, name: 'Dean', posts: [
                { id: 10, author_id: 1, message: `Dean's first post` },
                { id: 13, author_id: 1, message: `Dean again` },
            ] },
            { id: 2, name: 'Sarah', posts: [
              { id: 12, author_id: 2, message: `Hello I'm Sarah` },
            ] },
            { id: 3, name: 'Baz', posts: [
              { id: 11, author_id: 3, message: `Barry's first post` },
              { id: 14, author_id: 3, message: `Bazza again` },
            ] },
            { id: 4, name: 'Other guy', posts: [] }
          ], 'fetches records with related models'
        );
      });

    });

  });
}
