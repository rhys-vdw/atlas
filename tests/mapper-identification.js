import test from 'tape-catch';
import Mapper, { instance as mapper } from '../lib/mapper';

test('Mapper - identification', t => {

  t.test('defaultOptions', t => {

    t.equal(
      mapper.getOption('idAttribute'), 'id',
      "idAttribute = 'id'"
    );

    t.end();
  });

  t.test('Mapper#identify() - single primary key', t => {

    const ID_ATTRIBUTE = 'ID_ATTRIBUTE';

    const withIdAttribute = mapper.idAttribute(ID_ATTRIBUTE);

    const RECORD = { [ID_ATTRIBUTE]: 10 };

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
