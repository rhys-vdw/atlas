import test from 'tape';
import CamelCase from './helpers/camel-case';

import Mapper from '../../../lib/mapper';
import { NoRowsFoundError, NotFoundError } from '../../../lib/errors';

test('Mapper - retrieval', t => {

  t.test('default state', t => {

    t.equal(
      Mapper.requireState('isSingle'), false,
      'isSingle = false'
    );

    t.equal(
      Mapper.requireState('isRequired'), false,
      'isRequired = false'
    );

    t.end();
  });

  t.test('Mapper#prepareFetch()', t => {

    const Things = Mapper.table('things');

    t.queriesEqual(
      Things.prepareFetch().toQueryBuilder(),
      `select "things".* from "things"`,
      `correct query when fetching all`
    );

    t.queriesEqual(
      Things.attributes('stuff', 'blah').prepareFetch().toQueryBuilder(),
      `select "things"."stuff", "things"."blah" from "things"`,
      `correct query when specifying attributes`
    );

    const Thing = Things.one();

    t.queriesEqual(
      Thing.prepareFetch().toQueryBuilder(),
      `select "things".* from "things" limit 1`,
      `correct query when fetching one`
    );

    t.end();
  });

  t.test('Mapper.handleFetchResponse()', t => {

    const Things = Mapper.table('things');

    const result = Things.handleFetchResponse({
      response: [{ id: 1 }, { id: 2 }]
    });

    t.deepEqual(
      result,
      [{ id: 1 }, { id: 2 }],
      `returns array of records`
    );

    t.end();
  });

  t.test('Mapper.one().handleFetchResponse()', t => {

    const Thing = Mapper.table('things').one();

    const single = Thing.handleFetchResponse({
      response: [{ id: 1 }]
    });

    t.deepEqual(single, { id: 1 }, `returns single record`);

    const empty = Thing.handleFetchResponse({
      response: []
    });

    t.equal(empty, null, `returns null if not found`);

    t.end();
  });

  t.test('Mapper.require().handleFetchResponse()', t => {

    const Things = Mapper.table('things');

    t.throws(
      () => Things.require().handleFetchResponse({ response: [] }),
      NoRowsFoundError,
      'throws `NoRowsFoundError` when nothing is returned.'
    );

    const Thing = Things.one();

    t.throws(
      () => Thing.require().handleFetchResponse({ response: [] }),
      NotFoundError,
      'throws `NotFoundError` when single record is not returned.'
    );

    t.end();
  });

  t.test('Mapper.attributes(...attributes)', st => {

    const Things = Mapper.table('things');

    st.queriesEqual(
      Things.attributes('this', 'that').prepareFetch().toQueryBuilder(),
      `select "things"."this", "things"."that" from "things"`
    );

    st.end();

  });

  t.test('Mapper.attributes(...attributes) - respects `attributeToColumn`', st => {

    const Things = Mapper.table('things').extend(CamelCase());

    st.queriesEqual(
      Things.attributes('someThing', 'anotherThing').prepareFetch().toQueryBuilder(),
      `select "things"."some_thing", "things"."another_thing" from "things"`
    );

    st.end();

  });


  t.test('Mapper.handleFetchResponse() - respects `columnToAttribute`', st => {

    const People = Mapper.table('people').extend(CamelCase());

    const people = [
      { id: 1, first_name: 'Tom',  last_name: 'Smith' },
      { id: 1, first_name: 'Jane', last_name: 'Doe' },
      { id: 1, first_name: 'John', last_name: 'Doe' }
    ];

    const result = People.handleFetchResponse({ response: people });

    st.deepEqual(result, [
        { id: 1, firstName: 'Tom',  lastName: 'Smith' },
        { id: 1, firstName: 'Jane', lastName: 'Doe' },
        { id: 1, firstName: 'John', lastName: 'Doe' }
      ],
      `select "things"."some_thing", "things"."another_thing" from "things"`
    );

    st.end();

  });
});
