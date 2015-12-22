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

    t.databaseTest('`Mapper#getRelation()`', knex, tables, st => {

      const Groups = Mapper.table('groups');

      const Users = Mapper.table('users').relations({
        groups: belongsToMany(Groups, {
          otherRef: 'author_id', pivotTable: 'memberships'
        })
      });

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
            Users.getRelation('groups').of(1).pivotAttributes('is_owner').fetch(),
            [
              { _pivot_user_id: 1, _pivot_is_owner: true, id: 10,
                name: `General` },
              { _pivot_user_id: 1, _pivot_is_owner: true, id: 11,
                name: `Balloon Enthusiasts` }
            ],
            `with pivot attributes`
          ),
          st.resolvesToDeep(
            Users.getRelation('groups').of({ id: 2, name: 'Sarah' }).fetch(),
            [{
              _pivot_user_id: 2, id: 10, name: `General`
            }, {
              _pivot_user_id: 2, id: 12, name: `Off topic`
            }],
            `Mapper#getRelation(relation).of({id}) resolves correctly`
          ),
          st.resolvesToDeep(
            Users.getRelation('groups').of(1, 3)
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
            `Mapper#getRelation(relation).of(id, id).omitPivot() resolves ` +
            `correctly`
          ),
          st.resolvesToDeep(
            Users.getRelation('groups').of([1, 3])
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
            `Mapper#getRelation(relation).of([id, id]).omitPivot() resolves ` +
            `correctly`
          ),
          st.resolvesToDeep(
            Users.getRelation('groups').of({ id: 4 }).fetch(),
            [],
            `Mapper#getRelation(relation).of({id}) resolves to [] if none found`
          ),
          st.resolvesToDeep(
            Users.getRelation('groups').of([{ id: 4 }, { id: 6 }]).fetch(),
            [],
            `Mapper#getRelation(relation).of([{id}, {id}]) resolves to [] if ` +
            `none found`
          )
        );
      });
    });

    t.databaseTest('`Mapper#loadInto()`', knex, tables, st => {

      const Groups = Mapper.table('groups');

      const Users = Mapper.table('users').relations({
        groups: belongsToMany(Groups, {
          otherRef: 'author_id', pivotTable: 'memberships'
        })
      });

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

        const dean = { id: 1, name: 'dean' };
        const sarah = { id: 2, name: 'Sarah' };
        const baz = { id: 3, name: 'Baz' };
        const other = { id: 4, name: 'Other' };

        return Promise.join(
          st.resolvesToDeep(
            Users.loadInto({ id: 1, name: 'dean' }, 'groups'),
            { id: 1, name: 'dean', groups: [
              { _pivot_user_id: 1, id: 10, name: `General` },
              { _pivot_user_id: 1, id: 11, name: `Balloon Enthusiasts` }
            ] },
            'loads into single record'
          ),
          st.resolvesToDeep(
            Users.loadInto([sarah, baz], 'groups'), [
              { id: 2, name: 'Sarah', groups: [
                { _pivot_user_id: 2, id: 10, name: `General` },
                { _pivot_user_id: 2, id: 12, name: `Off topic` }
              ] },
              { id: 3, name: 'Baz', groups: [
                { _pivot_user_id: 3, id: 10, name: `General` },
                { _pivot_user_id: 3, id: 12, name: `Off topic` }
              ] }
            ], 'loads into multiple records'

          ),
          st.resolvesToDeep(
            Users.loadInto([dean, other], 'groups'), [
              { id: 1, name: 'dean', groups: [
                { _pivot_user_id: 1, id: 10, name: `General` },
                { _pivot_user_id: 1, id: 11, name: `Balloon Enthusiasts` }
              ] },
              { id: 4, name: 'Other', groups: [] }
            ], 'loads related into one record and [] into another'
          )
        );
      });
    });

    t.databaseTest('`Mapper#withRelated()`', knex, tables, st => {

      const Groups = Mapper.table('groups');

      const Users = Mapper.table('users').relations({
        groups: belongsToMany(Groups, {
          otherRef: 'author_id', pivotTable: 'memberships'
        })
      });

      return knex('users').insert([
        { id: 1, name: 'Dean' },
        { id: 2, name: 'Sarah' },
        { id: 3, name: 'Baz' },
        { id: 4, name: 'Other' },
      ]).then(() => knex('groups').insert([
        { id: 10, name: `General` },
        { id: 11, name: `Balloon Enthusiasts` },
        { id: 12, name: `Off topic` },
      ])).then(() => knex('memberships').insert([
        { user_id: 1, group_id: 10, is_owner: true },
        { user_id: 2, group_id: 10, is_owner: false },
        { user_id: 3, group_id: 10, is_owner: false },
        { user_id: 1, group_id: 11, is_owner: true },
        { user_id: 2, group_id: 12, is_owner: false },
        { user_id: 3, group_id: 12, is_owner: true },
      ])).then(() => {

        return st.resolvesToDeep(
          Users.query('orderBy', 'id').withRelated('groups').fetch(), [
            { id: 1, name: 'Dean', groups: [
              { _pivot_user_id: 1, id: 10, name: `General` },
              { _pivot_user_id: 1, id: 11, name: `Balloon Enthusiasts` }
            ] },
            { id: 2, name: 'Sarah', groups: [
              { _pivot_user_id: 2, id: 10, name: `General` },
              { _pivot_user_id: 2, id: 12, name: `Off topic` }
            ] },
            { id: 3, name: 'Baz', groups: [
              { _pivot_user_id: 3, id: 10, name: `General` },
              { _pivot_user_id: 3, id: 12, name: `Off topic` }
            ] },
            { id: 4, name: 'Other', groups: [] }
          ], 'fetches records with related models'
        );
      });

    });

  });
}
