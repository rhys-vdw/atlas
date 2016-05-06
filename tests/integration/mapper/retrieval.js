import Promise from 'bluebird';
import test from 'tape';
import {
  UnidentifiableRecordError, NoRowsFoundError
} from '../../../lib/errors';

function peopleTable(people) {
  people.integer('person_id');
  people.string('name');
}
export default function(atlas) {

  const Mapper = atlas('Mapper');
  const { knex } = atlas;

  test('Mapper - Retrieval', t => {

    t.databaseTest('Mapper.fetch()', knex, { people: peopleTable }, t => {

      return knex('people').insert([
        { person_id: 1, name: 'Tom' },
        { person_id: 2, name: 'Dick' },
        { person_id: 3, name: 'Harry' }
      ]).then(() => {

        const People = Mapper.table('people');

        t.resolvesToDeep(
          People.fetch(), [
            { person_id: 1, name: 'Tom' },
            { person_id: 2, name: 'Dick' },
            { person_id: 3, name: 'Harry' }
          ],
          'returns all'
        );

        t.resolvesToDeep(
          People.query('orderBy', 'person_id').first(),
          { person_id: 1, name: 'Tom' },
          'returns one'
        );

        t.rejects(
          People.require().where('name', 'Bob').fetch(),
          NoRowsFoundError,
          'rejects with `NoRowsFoundError` with `require()`'
        );

      });
    });

    t.databaseTest('Mapper.find(), Mapper.findBy()', knex, {
      people: peopleTable
    }, t => {

      const People = Mapper.table('people').idAttribute('person_id');

      t.plan(8);

      return knex('people').insert([
        { person_id: 1, name: 'Jane' },
        { person_id: 2, name: 'Sally' },
        { person_id: 3, name: 'Mandy' }
      ]).then(() => Promise.join(

        t.resolvesToDeep(
          People.find(1),
          { person_id: 1, name: 'Jane' },
          '`find()` record by ID'
        ),

        t.resolvesToDeep(
          People.find({ person_id: 2 }),
          { person_id: 2, name: 'Sally' },
          '`find()` record by ID in attributes'
        ),

        t.resolvesToDeep(
          People.findBy('name', 'Mandy'),
          { person_id: 3, name: 'Mandy' },
          '`findBy()` returns record when given value'
        ),

        t.resolvesToDeep(
          People.findBy('name', { name: 'Mandy' }),
          { person_id: 3, name: 'Mandy' },
          '`findBy()` returns record when given attributes'
        ),

        t.resolvesToDeep(
          People.query('orderBy', 'person_id').find(1, 2), [
            { person_id: 1, name: 'Jane' },
            { person_id: 2, name: 'Sally' },
          ],
          '`findBy()` finds multiple records by ID'
        ),

        t.resolvesTo(
          People.find(null), null,
          '`findBy(null)` resolves to null'
        ),

        t.resolvesToDeep(
          People.find([]), [],
          '`findBy([])` resolves to []'
        ),

        t.rejects(
          People.find({}),
          UnidentifiableRecordError,
          '`findBy({})` rejects with UnidentifiableRecordError'
        )

      ));
    });
  });

}
