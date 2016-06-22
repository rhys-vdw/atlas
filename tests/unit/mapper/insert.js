import test from 'tape';
import Knex from 'knex';

import Mapper from '../../../lib/mapper';
import CamelCase from '../../../lib/plugins/CamelCase';

const Pg = Mapper.knex(Knex({ client: 'pg' }));

test('Mapper.insert()', t => {

  t.plan(5);

  t.throws(
    () => Mapper.insert(),
    TypeError,
    'throws `TypeError` synchronously with no arguments'
  );

  t.resolvesTo(
    Mapper.insert(null), null,
    'resolves `null` to `null`'
  );

  t.resolvesToDeep(
    Mapper.insert([]), [],
    'resolves empty array to empty array'
  );

  t.resolvesToDeep(
    Mapper.insert([null, null]), [],
    'resolves array of `null` values to an empty array'
  );

  t.resolvesToDeep(
    Mapper.insert(null, null), [],
    'resolves multiple `null` value arguments to an empty array'
  );
});

test('Mapper.prepareInsert()', t => {

  const Records = Mapper.table('records').prepareInsert(
    { text: 'a' }
  );

  t.queriesEqual(
    Records.toQueryBuilder(),
    `insert into "records" ("text") values ('a')`,
    `single record - SQL`
  );

  const Things = Pg.table('things').prepareInsert(
    { item: 'a' }
  );

  t.queriesEqual(
    Things.toQueryBuilder(),
    `insert into "things" ("item") values ('a') returning *`,
    `single record - PostgreSQL`
  );

  const Apples = Mapper.table('apples').prepareInsert([
    { color: 'red' },
    { color: 'green' }
  ]);

  t.queriesEqual(
    Apples.toQueryBuilder(),
    `insert into "apples" ("color") values ('red'), ('green')`,
    `multiple records`
  );

  t.end();
});

test('Mapper.handleInsertOneResponse()', t => {

  const Records = Mapper.idAttribute('record_id');

  t.deepEqual(
    Records.handleInsertOneResponse([5], { text: 'a' }),
    { record_id: 5, text: 'a' },
    'ID array response'
  );

  t.deepEqual(
    Records.handleInsertOneResponse([], { item: 'a' }),
    { item: 'a' },
    'Empty response'
  );

  t.end();
});

test(
  'Mapper.handleInsertOneResponse() - respects `columnToAttribute`'
, t => {

  const Records = Mapper.extend(CamelCase()).idAttribute('recordId');

  t.deepEqual(
    Records.handleInsertOneResponse([5], { someValue: 'a' }),
    { recordId: 5, someValue: 'a' },
    'ID array response'
  );

  const objectResponse = [{ record_id: 5, some_value: 'a' }];
  t.deepEqual(
    Records.handleInsertOneResponse(objectResponse, { someValue: 'a' }),
    { recordId: 5, someValue: 'a' },
    'ID array response'
  );

  t.end();
});


test('Mapper.handleInsertManyResponse() - single ID response', t => {

  const records = [
    { code: 1234, color: 'red' },
    { color: 'green' }
  ];

  const Records = Mapper.idAttribute('code');

  t.deepEqual(
    Records.handleInsertManyResponse([1234], records),
    [{ code: 1234, color: 'red' }, { color: 'green' }],
    'assigns ID attribute to first record only'
  );

  t.end();
});

test('Mapper.handleInsertManyResponse() - PostgreSQL response', t => {
  const Oranges = Pg.table('oranges');
  const oranges = [{ name: 'valencia' }, { name: 'navel'}];

  const response = [
    { id: 1, name: 'valencia', created_at: 'some_date' },
    { id: 2, name: 'navel', created_at: 'some_time' }
  ];

  const result = Oranges.handleInsertManyResponse(response, oranges);

  t.deepEqual(oranges[0], { name: 'valencia' }, 'record 0 is unchanged');
  t.deepEqual(oranges[1], { name: 'navel' }, 'record 1 is unchanged');

  t.deepEqual(
    result,
    [
      { id: 1, name: 'valencia', created_at: 'some_date' },
      { id: 2, name: 'navel', created_at: 'some_time' }
    ],
    'returns updates records'
  );

  t.end();
});

test(
  'Mapper.handleInsertManyResponse() - object response - ' +
  'respects `attributeToColumn`',
t => {

  const Oranges = Mapper.extend(CamelCase())
    .table('oranges').idAttribute('orangeId');

  const oranges = [{ orangeType: 'valencia' }, { orangeType: 'navel'}];

  const response = [
    { orange_id: 1, orange_type: 'valencia', created_at: 'some_date' },
    { orange_id: 2, orange_type: 'navel', created_at: 'some_time' }
  ];

  t.deepEqual(
    Oranges.handleInsertManyResponse(response, oranges),
    [
      { orangeId: 1, orangeType: 'valencia', createdAt: 'some_date' },
      { orangeId: 2, orangeType: 'navel', createdAt: 'some_time' }
    ],
    'returns updated records'
  );

  t.end();
});


test(
  'Mapper.handleInsertManyResponse() - idResponse - ' +
  'respects `attributeToColumn`',
t => {

  const Oranges = Mapper.extend(CamelCase())
    .table('oranges').idAttribute('orangeId');

  const oranges = [{ orangeType: 'valencia' }, { orangeType: 'navel'}];

  t.deepEqual(
    Oranges.handleInsertManyResponse([1], oranges),
    [
      { orangeId: 1, orangeType: 'valencia' },
      { orangeType: 'navel' }
    ],
    'returns records with one updated (single ID response)'
  );

  t.deepEqual(
    Oranges.handleInsertManyResponse([1, 2], oranges),
    [
      { orangeId: 1, orangeType: 'valencia' },
      { orangeId: 2, orangeType: 'navel' }
    ],
    'returns updated records (multi ID response)'
  );

  t.end();
});


test('Mapper.defaultAttributes().prepareInsert()', t => {

  const Defaults = Mapper.table('table').defaultAttributes({
    default: 'default'
  });

  t.queriesEqual(
    Defaults.prepareInsert({ default: 'override' }).toQueryBuilder(),
    `insert into "table" ("default") values ('override')`
  );

  t.queriesEqual(
    Defaults.prepareInsert({}).toQueryBuilder(),
    `insert into "table" ("default") values ('default')`
  );

  const FnDefaults = Mapper.table('table').setState({
    testState: 'state_value'
  }).defaultAttributes({
    default: 'default_value',
    default_fn(attributes) {
      return this.requireState('testState') + '/' + attributes.set;
    }
  });

  t.queriesEqual(
    FnDefaults.prepareInsert({ set: 'set_value' }).toQueryBuilder(), `
    insert into "table"
      ("default", "default_fn", "set")
    values
      ('default_value', 'state_value/set_value', 'set_value')
    `
  );

  t.end();
});

test('Mapper.strictAttributes().prepareInsert()', t => {

  const Strict = Mapper.table('table').strictAttributes({
    strict: 'strict_value'
  });

  t.queriesEqual(
    Strict.prepareInsert({ strict: 'overridden' }).toQueryBuilder(),
    `insert into "table" ("strict") values ('strict_value')`
  );

  t.queriesEqual(
    Strict.prepareInsert({}).toQueryBuilder(),
    `insert into "table" ("strict") values ('strict_value')`
  );

  const FnStrict = Mapper.table('table').setState({
    testState: 'state_value'
  }).strictAttributes({
    strict: 'strict_value',
    strict_fn(attributes) {
      return this.requireState('testState') + '/' + attributes.strict;
    }
  });

  t.queriesEqual(
    FnStrict.prepareInsert({ strict: 'set' }).toQueryBuilder(), `
      insert into "table" ("strict", "strict_fn")
      values ('strict_value', 'state_value/set')
    `
  );

  t.end();
});

test('Mapper.defaultAttributes().strictAttributes().prepareInsert()', t => {

  const DefaultStrict = Mapper.table('table').defaultAttributes({
    default: 'default_value'
  }).strictAttributes({
    strict_fn: attributes => attributes.default + '/' + attributes.set
  });

  t.queriesEqual(
    DefaultStrict.prepareInsert({
      strict_fn: 'overridden', set: 'set_value'
    }).toQueryBuilder(), `
      insert into "table" ("default", "set", "strict_fn")
      values ('default_value', 'set_value', 'default_value/set_value')
    `,
    'resolves strict with defaulted attributes'
  );

  t.end();
});

test('Mapper.extend(CamelCase()).prepareInsert()', t => {

  const Shapes = Mapper.table('shapes').extend(CamelCase());

  const records = [
    { shapeType: 'square', sideCount: 4 },
    { shapeType: 'triangle', sideCount: 3 }
  ];

  t.queriesEqual(
    Shapes.prepareInsert(records).toQueryBuilder(), `
      insert into "shapes" ("shape_type", "side_count")
      values ('square', 4), ('triangle', 3)
    `,
    'respects `attributeToColumn`'
  );

  t.end();
});
