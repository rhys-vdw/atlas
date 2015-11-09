import test from 'tape';

import Mapper from '../../../lib/mapper';
import { NoRowsFoundError, NotFoundError } from '../../../lib/errors';

test('Mapper - retrieval', t => {

  t.test('defaultOptions', t => {

    t.equal(
      Mapper.getOption('isSingle'), false,
      'isSingle = false'
    );

    t.equal(
      Mapper.getOption('isRequired'), false,
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

    const result = Thing.handleFetchResponse({
      response: [{ id: 1 }]
    });

    t.deepEqual(
      result,
      { id: 1 },
      `returns single record`
    );

    t.end();
  });

  t.test('Mapper.require().handleFetchResponse()', t => {

    const Things = Mapper.table('things');

    t.throws(
      () => Things.require().handleFetchResponse({ response: [] }),
      NoRowsFoundError,
      'fires `NoRowsFoundError` when nothing is returned.'
    );

    const Thing = Things.one();

    t.throws(
      () => Thing.require().handleFetchResponse({ response: [] }),
      NotFoundError,
      'fires `NotFoundError` when single record is not returned.'
    );

    t.end();
  });

});
