import Promise from 'bluebird';
import test from 'tape';
import {
  UnidentifiableRecordError, NoRowsFoundError, NotFoundError
} from '../../../lib/errors';


function peopleTable(people) {
  people.integer('person_id');
  people.string('name');
}

export default function(atlas) {

  const Mapper = atlas('Mapper');
  const { knex } = atlas;

  test('Mapper - Destruction', t => {

    const People = Mapper.table('people').idAttribute('person_id');

    t.databaseTest('Mapper.destroy(id)', knex, { people: peopleTable }, st => {

      return knex('people').insert([
        { person_id: 1, name: 'Tom' },
        { person_id: 2, name: 'Dick' },
        { person_id: 3, name: 'Harry' },
      ]).then(() =>
        st.resolvesTo(
          People.destroy(2),
          1,
          'destroy returns row count...'
        )
      ).then(() =>
        st.resolvesToDeep(
          People.fetchAll(), [
            { person_id: 1, name: 'Tom' },
            { person_id: 3, name: 'Harry' },
          ],
          '...record is destroyed'
        )
      );
    })

    t.databaseTest('Mapper.destroy(Object)', knex, { people: peopleTable }, st => {

      return knex('people').insert([
        { person_id: 1, name: 'Tom' },
        { person_id: 2, name: 'Dick' },
        { person_id: 3, name: 'Harry' },
      ]).then(() =>
        st.resolvesTo(
          People.destroy({ person_id: 1 }),
          1,
          'destroy returns row count...'
        )
      ).then(() =>
        st.resolvesToDeep(
          People.fetchAll(), [
            { person_id: 2, name: 'Dick' },
            { person_id: 3, name: 'Harry' },
          ],
          '...record is destroyed'
        )
      );
    });

    t.databaseTest(
      'Mapper.destroy(...(Object|id))', knex, { people: peopleTable }, st => {

      return knex('people').insert([
        { person_id: 1, name: 'Tom' },
        { person_id: 2, name: 'Dick' },
        { person_id: 3, name: 'Harry' },
      ]).then(() =>
        st.resolvesTo(
          People.destroy({ person_id: 1 }, 2),
          2,
          'destroy returns row count...'
        )
      ).then(() =>
        st.resolvesToDeep(
          People.fetchAll(), [
            { person_id: 3, name: 'Harry' },
          ],
          '...record is destroyed'
        )
      );
    });

    t.databaseTest(
      'Mapper.destroy(id) - non-existant ID',
      knex, { people: peopleTable }, st => Promise.join(

      st.resolvesTo(
        People.destroy(1),
        0,
        'returns 0 for non-existant record'
      ),

      st.rejects(
        People.require().destroy(1),
        NotFoundError,
        'rejects with `NotFoundError` with `.require()`'
      )

    ));


    t.databaseTest('Mapper.destroyAll()', knex, { people: peopleTable }, st => {

      return knex('people').insert([
        { person_id: 1, name: 'Tom' },
        { person_id: 2, name: 'Dick' },
        { person_id: 3, name: 'Harry' },
      ]).then(() =>
        st.resolvesTo(
          People.destroyAll(),
          3,
          ' returns row count...'
        )
      ).then(() =>
        st.resolvesToDeep(
          People.fetchAll(), [],
          '...records are destroyed'
        )
      );
    });

    t.databaseTest(
      'Mapper.destroyAll() - no matching rows',
      knex, { people: peopleTable }, st => Promise.join(

      st.resolvesTo(
        People.where({ name: 'William' }.destroyAll(),
        0,
        'returns 0 for non-existant record'
      ),

      st.rejects(
        People.require().where({ name: 'William' }.destroyAll(),
        NoRowsFoundError,
        'rejects with `NoRowsFoundError` with `.require()`'
      )

    ));
  });
}

