import test from 'tape';
import Promise from 'bluebird';

const tables = {
  users(users) {
    users.integer('id');
    users.string('name');
  },

  memberships(memberships) {
    memberships.integer('user_id');
    memberships.integer('group_id');
    memberships.bool('is_owner');
  },

  groups(groups) {
    groups.integer('id');
    groups.string('name');
  },
};

export default function(atlas) {

  const Mapper = atlas('Mapper');
  const { knex } = atlas;
  const { belongsToMany } = atlas.relations;

  test('Mapper - relations - BelongsToMany', t => {

    t.databaseTest('`Mapper#related()`', knex, tables, st => {

      const Groups = Mapper.table('groups');

      const Users = Mapper.table('users').relations({
        groups: belongsToMany(Groups, {
          otherRef: 'author_id', pivotTable: 'memberships'
        })
      });

      const dean = { id: 1, name: 'dean' };
      const sarah = { id: 2, name: 'Sarah' };
      const baz = { id: 3, name: 'Baz' };
      const other = { id: 4, name: 'Other' };

      return knex('groups').insert([
        { id: 10, name: `General` },
        { id: 11, name: `Balloon Enthusiasts` },
        { id: 12, name: `Off topic` },
      ]).then(() => knex('memberships').insert([
        { user_id: 1, group_id: 10, is_owner: true },
        { user_id: 2, group_id: 10, is_owner: false },
        { user_id: 3, group_id: 10, is_owner: false },
        { user_id: 1, group_id: 11, is_owner: true },
        { user_id: 2, group_id: 12, is_owner: false },
        { user_id: 3, group_id: 12, is_owner: true },
      ])).then(() => {

        return Promise.join(
          st.resolvesToDeep(
            Users.related('groups', 1).pivotAttributes('is_owner').fetch(), [
              { _pivot_user_id: 1, _pivot_is_owner: true, id: 10,
                name: `General` },
              { _pivot_user_id: 1, _pivot_is_owner: true, id: 11,
                name: `Balloon Enthusiasts` }
            ],
            `Mapper#related(relation, id).pivotAttributes() resolves correctly`
          ),
          st.resolvesToDeep(
            Users.related('groups', { id: 2, name: 'Sarah' }).fetch(), [{
              _pivot_user_id: 2, id: 10, name: `General`
            }, {
              _pivot_user_id: 2, id: 12, name: `Off topic`
            }],
            `Mapper#related(relation, {id}) resolves correctly`
          ),
          st.resolvesToDeep(
            Users.related('groups', 1, 3)
              .omitPivot()
              .query('orderBy',
                'memberships.user_id',
                'memberships.group_id'
              ).fetch(),
            [
              { id: 10, name: `General` },
              { id: 11, name: `Balloon Enthusiasts` },
              { id: 10, name: `General` },
              { id: 12, name: `Off topic` },
            ],
            `Mapper#related(relation, id, id).omitPivot() resolves correctly`
          ),
          st.resolvesToDeep(
            Users.related('groups', [1, 3])
              .omitPivot()
              .query('orderBy',
                'memberships.user_id',
                'memberships.group_id'
              ).fetch(),
            [
              { id: 10, name: `General` },
              { id: 11, name: `Balloon Enthusiasts` },
              { id: 10, name: `General` },
              { id: 12, name: `Off topic` },
            ],
            `Mapper#related(relation, [id, id]).omitPivot() resolves correctly`
          ),
          st.resolvesToDeep(
            Users.related('groups', { id: 4 }).fetch(),
            [],
            `Mapper#related(relation, {id}) resolves to [] if none found`
          ),
          st.resolvesToDeep(
            Users.related('groups', [{ id: 4 }, { id: 6 }]).fetch(),
            [],
            `Mapper#related(relation, [{id}, {id}]) resolves to [] if none ` +
            `found`
          )
        );
      });
    });

    /*
    t.databaseTest('`Mapper#loadInto()`', knex, tables, st => {

      const Groups = Mapper.table('groups');

      const Users = Mapper.table('users').relations({
        groups: belongsToMany(Groups, {
          otherRef: 'author_id', pivotTable: 'memberships'
        })
      });

      return knex('groups').insert([
        { id: 10, author_id: 1, message: `Dean's first post` },
        { id: 11, author_id: 3, message: `Barry's first post` },
        { id: 12, author_id: 2, message: `Hello I'm Sarah` },
        { id: 13, author_id: 1, message: `Dean again` },
        { id: 14, author_id: 3, message: `Bazza again` },
      ]).then(() => {

        const dean = { id: 1, name: 'dean' };
        const sarah = { id: 2, name: 'Sarah' };
        const baz = { id: 3, name: 'Baz' };
        const other = { id: 4, name: 'Other' };

        return Promise.join(
          st.resolvesToDeep(
            Users.loadInto(dean, 'groups'),
            { id: 1, name: 'dean', groups: [
                { id: 10, author_id: 1, message: `Dean's first post` },
                { id: 13, author_id: 1, message: `Dean again` },
            ] },
            'loads into single record'
          ),
          st.resolvesToDeep(
            Users.loadInto([sarah, baz], 'groups'), [
              { id: 2, name: 'Sarah', groups: [
                { id: 12, author_id: 2, message: `Hello I'm Sarah` },
              ] },
              { id: 3, name: 'Baz', groups: [
                { id: 11, author_id: 3, message: `Barry's first post` },
                { id: 14, author_id: 3, message: `Bazza again` },
              ] }
            ], 'loads into multiple records'
          ),
          st.resolvesToDeep(
            Users.loadInto([dean, other], 'groups'), [
              { id: 1, name: 'dean', groups: [
                { id: 10, author_id: 1, message: `Dean's first post` },
                { id: 13, author_id: 1, message: `Dean again` },
              ] },
              { id: 4, name: 'Other', groups: [] }
            ], 'loads related into one record and [] into another'
          )
        );
      });
    });

    t.databaseTest('`Mapper#withRelated()`', knex, {
      users: usersTable, groups: groupsTable
    }, st => {

      const Groups = Mapper.table('groups');

      const Users = Mapper.table('users').relations({
        groups: hasMany(Groups.query('orderBy', 'id'), { otherRef: 'author_id' })
      });

      return knex('groups').insert([
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
          Users.query('orderBy', 'id').withRelated('groups').fetch(), [
            { id: 1, name: 'Dean', groups: [
                { id: 10, author_id: 1, message: `Dean's first post` },
                { id: 13, author_id: 1, message: `Dean again` },
            ] },
            { id: 2, name: 'Sarah', groups: [
              { id: 12, author_id: 2, message: `Hello I'm Sarah` },
            ] },
            { id: 3, name: 'Baz', groups: [
              { id: 11, author_id: 3, message: `Barry's first post` },
              { id: 14, author_id: 3, message: `Bazza again` },
            ] },
            { id: 4, name: 'Other guy', groups: [] }
          ], 'fetches records with related models'
        );
      });

    });
*/

  });
}