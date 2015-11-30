import Promise from 'bluebird';
import test from 'tape';

const tables = {
  actors(actors) {
    actors.integer('id');
    actors.string('name');
  },

  movies(movies) {
    movies.integer('id');
    movies.string('title');
    movies.integer('director_id');
  },

  roles(roles) {
    roles.integer('actor_id');
    roles.integer('movie_id');
    roles.string('character_name');
  },

  directors(directors) {
    directors.integer('id');
    directors.string('name');
  }
};

export default function(atlas) {

  const Mapper = atlas('Mapper');
  const { knex, register, relations } = atlas;
  const { hasMany, belongsTo, belongsToMany } = relations;

  test('Mapper - eager loading', t => {
    t.databaseTest('with ', knex, tables, st => {
      register({
        Actors: Mapper.table('actors').relations({
          movies: belongsToMany('Movies', { pivotTable: 'roles' })
        }),
        Movies: Mapper.table('movies').relations({
          cast: belongsToMany('Actors', { pivotTable: 'roles' }),
          director: belongsTo('Directors')
        }),
        Directors: Mapper.table('directors').relations({
          movies: hasMany('Movies')
        })
      });

      return knex('actors').insert([
        { id: 1, name: 'Kurt Russel' },
        { id: 2, name: 'James Spader' }
      ]).then(() => knex('roles').insert([
        { actor_id: 1, movie_id: 1, character_name: 'MacReady' },
        { actor_id: 1, movie_id: 2, character_name: 'Snake' },
        { actor_id: 1, movie_id: 3, character_name: "Col. O'Neil" },
        { actor_id: 2, movie_id: 3, character_name: 'Dr. Jackson' },
      ])).then(() => knex('movies').insert([
        { id: 1, director_id: 1, title: 'The Thing' },
        { id: 2, director_id: 1, title: 'Escape From LA' },
        { id: 3, director_id: 2, title: 'Stargate' },
      ])).then(() => knex('directors').insert([
        { id: 1, name: 'John Carpenter' },
        { id: 2, name: 'Roland Emmerich' },
      ])).then(() => Promise.join(

        st.resolvesToDeep(
          atlas('Actors').withRelated({
            movies: { pivotAttributes: ['character_name'] }
          }).find(1),
          { id: 1, name: 'Kurt Russel', movies: [
            { _pivot_actor_id: 1, _pivot_character_name: 'MacReady',
              id: 1, title: 'The Thing', director_id: 1 },
            { _pivot_actor_id: 1, _pivot_character_name: 'Snake',
              id: 2, title: 'Escape From LA', director_id: 1 },
            { _pivot_actor_id: 1, _pivot_character_name: "Col. O'Neil",
              id: 3, title: 'Stargate', director_id: 2 },
          ]},
          'eager loads single `belongsToMany`, specifying `pivotAttributes`'
        ),

        st.resolvesToDeep(
          atlas('Actors').withRelated('movies.director').find(2),
          { id: 2, name: 'James Spader', movies: [
            { _pivot_actor_id: 2, id: 3, title: 'Stargate', director_id: 2,
              director: { id: 2, name: 'Roland Emmerich' }
            },
          ]},
          'eager loads single `belongsToMany`, specifying `pivotAttributes`'
        ),

        st.resolvesToDeep(
          atlas('Directors')
          .withRelated('movies.cast', 'movies.director')
          .fetch(),
          [ { id: 1,
              name: 'John Carpenter',
              movies:
              [ { id: 1,
                  title: 'The Thing',
                  director_id: 1,
                  cast: [ { id: 1, name: 'Kurt Russel', _pivot_movie_id: 1 } ],
                  director: { id: 1, name: 'John Carpenter' } },
                { id: 2,
                  title: 'Escape From LA',
                  director_id: 1,
                  cast: [ { id: 1, name: 'Kurt Russel', _pivot_movie_id: 2 } ],
                  director: { id: 1, name: 'John Carpenter' }
            }]
          }, { id: 2,
               name: 'Roland Emmerich',
               movies: [ {
                 id: 3,
                 director_id: 2,
                 title: 'Stargate',
                 cast: [
                   { id: 1, name: 'Kurt Russel', _pivot_movie_id: 3 },
                   { id: 2, name: 'James Spader', _pivot_movie_id: 3 } ],
                 director: { id: 2, name: 'Roland Emmerich' }
               } ]
          }]
        , 'eager loads two subchildren')

      ));
    });
  });
}
