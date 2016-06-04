import Promise from 'bluebird';
import test from 'tape';

export default function(atlas) {

  const Mapper = atlas('Mapper');
  const { knex, related, relations } = atlas;

  test('Mapper - eager loading', t => {

    const filmTables = {
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

    t.databaseTest('loading nested relations', knex, filmTables, st => {

      const Actors = Mapper.table('actors').relations({
        movies: m => m.belongsToMany(Movies, { pivotTable: 'roles' })
      });

      const Movies = Mapper.table('movies').relations({
        cast: m => m.belongsToMany(Actors, { pivotTable: 'roles' }),
        director: m => m.belongsTo(Directors)
      });

      const Directors = Mapper.table('directors').relations({
        movies: m => m.hasMany(Movies)
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
          Actors.with(
            related('movies').mapper({pivotAttributes: 'character_name'})
          ).find(1),
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
          Actors.with(related('movies').with('director')).find(2),
          { id: 2, name: 'James Spader', movies: [
            { _pivot_actor_id: 2, id: 3, title: 'Stargate', director_id: 2,
              director: { id: 2, name: 'Roland Emmerich' }
            },
          ]},
          'eager loads nested relation'
        ),

        st.resolvesToDeep(
          Directors.with(related('movies').with('cast', 'director')).fetch(),
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
        , 'eager loads two nested beneath')

      ));
    });

    const nodesTables = {
      nodes(nodes) {
        nodes.integer('id');
        nodes.string('value');
        nodes.integer('next_id');
      }
    };

    t.databaseTest('loading recursive relations', knex, nodesTables, st => {

      const Nodes = Mapper.table('nodes').relations({
        next: m => m.belongsTo(Nodes, { selfRef: 'next_id' }),
      });

      return knex('nodes').insert([
          { id: 1, value: 'a', next_id: 2 },
          { id: 2, value: 't', next_id: 3 },
          { id: 3, value: 'l', next_id: 4 },
          { id: 4, value: 'a', next_id: 5 },
          { id: 5, value: 's', next_id: 6 },
          { id: 6, value: '.', next_id: 7 },
          { id: 7, value: 'j', next_id: 8 },
          { id: 8, value: 's', next_id: null }
      ]).then(() => Promise.join(

        st.resolvesToDeep(
          Nodes.with(
            related('next').with(
              related('next').with(
                related('next')))).find(2),
          { id: 2, value: 't', next_id: 3, next:
          { id: 3, value: 'l', next_id: 4, next:
          { id: 4, value: 'a', next_id: 5, next:
          { id: 5, value: 's', next_id: 6 } } } },
          'resolves explicit nested recursions'
        ),

        st.resolvesToDeep(
          Nodes.with(related('next').recursions(2)).find(2),
          { id: 2, value: 't', next_id: 3, next:
          { id: 3, value: 'l', next_id: 4, next:
          { id: 4, value: 'a', next_id: 5, next:
          { id: 5, value: 's', next_id: 6 } } } },
          'resolves the same recursion using `recursions(count)`'
        ),

        st.resolvesToDeep(
          Nodes.with(related('next').recursions(Infinity)).find(2),
          { id: 2, value: 't', next_id: 3, next:
          { id: 3, value: 'l', next_id: 4, next:
          { id: 4, value: 'a', next_id: 5, next:
          { id: 5, value: 's', next_id: 6, next:
          { id: 6, value: '.', next_id: 7, next:
          { id: 7, value: 'j', next_id: 8, next:
          { id: 8, value: 's', next_id: null, next: null} } } } } } },
          'resolves an infinite recursion'
        )

      ));
    });
  });
}
