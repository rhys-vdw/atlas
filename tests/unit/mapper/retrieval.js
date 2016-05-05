import test from 'tape';

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
    const Others = Mapper.table('other');

    st.queriesEqual(
      Things.attributes('this', 'that').prepareFetch().toQueryBuilder(),
      `select "things"."this", "things"."that" from "things"`
    );

    st.end();

  });
});
