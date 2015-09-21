import test from 'tape';
import mapper from '../../lib/mapper';

test('Mapper - identification', t => {

  t.test('defaultOptions', t => {

    t.equal(
      mapper.getOption('idAttribute'), 'id',
      "idAttribute = 'id'"
    );

    t.end();
  });

  t.test('Mapper#isNew() - single primary key', t => {
    const ID_ATTRIBUTE = 'ID_ATTRIBUTE';

    const withIdAttribute = mapper.idAttribute(ID_ATTRIBUTE);

    t.equal(
      withIdAttribute.isNew({ [ID_ATTRIBUTE]: 5 }),
      false,
      'determines that record with `idAttribute` set is not new'
    );

    t.equal(
      withIdAttribute.isNew({}),
      true,
      'determines that record without `idAttribute` set is new'
    );

    t.equal(
      withIdAttribute.isNew({ [ID_ATTRIBUTE]: null }),
      true,
      'determines that record with null `idAttribute` is new'
    );

    t.end();
  });

  t.test('Mapper#isNew() - composite primary key', t => {

    const ID_ATTRIBUTE_A = 'ID_ATTRIBUTE_A';
    const ID_ATTRIBUTE_B = 'ID_ATTRIBUTE_B';
    const ID_ATTRIBUTE = [ID_ATTRIBUTE_A, ID_ATTRIBUTE_B];

    const withIdAttribute = mapper.idAttribute(ID_ATTRIBUTE);

    t.equal(
      withIdAttribute.isNew({
        [ID_ATTRIBUTE_A]: 5,
        [ID_ATTRIBUTE_B]: 6
      }),
      false,
      'determines that record with both `idAttribute`s set is not new'
    );

    t.equal(
      withIdAttribute.isNew({}),
      true,
      'determines that record with no `idAttribute`s set is new'
    );

    t.equal(
      withIdAttribute.isNew({ [ID_ATTRIBUTE_A]: 5 }),
      true,
      'determines that record with one `idAttribute` unset is new'
    );

    t.equal(
      withIdAttribute.isNew({
        [ID_ATTRIBUTE_A]: null,
        [ID_ATTRIBUTE_B]: 5,
      }),
      true,
      'determines that record with one null `idAttribute` is new'
    );

    t.end();
  });

  t.test('Mapper#identify() - bad input', t => {

    const ID_ATTRIBUTE = 'ID_ATTRIBUTE';
    const withId = mapper.idAttribute(ID_ATTRIBUTE);

    t.equal(
      withId.identify(),
      undefined,
      'identifies no arguments as `undefined`'
    );

    t.equal(
      withId.identify(null),
      null,
      'identifies `null` as `null`'
    );

    t.deepEqual(
      withId.identify(null, null),
      [null, null],
      'identifies `null, null` as `[null, null]`'
    );

    t.deepEqual(
      withId.identify([null, null]),
      [null, null],
      'identifies `[null, null]` as `[null, null]`'
    );

    t.deepEqual(
      withId.identify([]),
      [],
      'identifies `[]` as `[]`'
    );

    t.end();
  });

  t.test('Mapper#identify() - single primary key', t => {

    const ID_ATTRIBUTE = 'ID_ATTRIBUTE';
    const RECORD = { [ID_ATTRIBUTE]: 10 };

    const withIdAttribute = mapper.idAttribute(ID_ATTRIBUTE);


    t.equal(
      withIdAttribute.identify(RECORD), 10,
      'identifies a single record'
    );

    const RECORDS = [
      { [ID_ATTRIBUTE]: 2 },
      { [ID_ATTRIBUTE]: 6 },
      { [ID_ATTRIBUTE]: 10 }
    ];

    t.deepEqual(
      withIdAttribute.identify(RECORDS), [2, 6, 10],
      'identifies multiple records'
    );

    t.deepEqual(
      withIdAttribute.identify(10), 10,
      'normalizes a single ID value'
    );

    t.deepEqual(
      withIdAttribute.identify([2, 6, 10]), [2, 6, 10],
      'normalizes an array of ID values'
    );

    t.end();
  });

  t.test('Mapper#identify() - composite key', t => {

    const ID_ATTRIBUTE_A = 'ID_ATTRIBUTE_A';
    const ID_ATTRIBUTE_B = 'ID_ATTRIBUTE_B';
    const ID_ATTRIBUTE = [ID_ATTRIBUTE_A, ID_ATTRIBUTE_B];

    const withIdAttribute = mapper.idAttribute(ID_ATTRIBUTE);

    const RECORD = {
      [ID_ATTRIBUTE_A]: 10,
      [ID_ATTRIBUTE_B]: 20
    };

    t.deepEqual(
      withIdAttribute.identify(RECORD), [10, 20],
      'identifies a single record'
    );

    const RECORDS = [
      { [ID_ATTRIBUTE_A]: 2,  [ID_ATTRIBUTE_B]: 4  },
      { [ID_ATTRIBUTE_A]: 6,  [ID_ATTRIBUTE_B]: 8  },
      { [ID_ATTRIBUTE_A]: 10, [ID_ATTRIBUTE_B]: 11 }
    ];

    t.deepEqual(
      withIdAttribute.identify(RECORDS),
      [[2, 4], [6, 8], [10, 11]],
      'identifies multiple records'
    );

    t.deepEqual(
      withIdAttribute.identify([10, 20]), [10, 20],
      'normalizes a composite ID'
    );

    t.deepEqual(
      withIdAttribute.identify([[2, 4], [6, 8], [10, 11]]),
      [[2, 4], [6, 8], [10, 11]],
      'normalizes an array of composite IDs'
    );

    t.end();
  });

});
