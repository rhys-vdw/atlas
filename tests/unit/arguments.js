import test from 'tape';

import {
  assertKeysCompatible, assignResolved, defaultsResolved, ensureArray,
  flattenPairs, keyCardinality, keysCompatible, resolveObject
} from '../../lib/arguments';

test('keyCardinality', t => {

  t.equal(keyCardinality(null), 0);
  t.equal(keyCardinality('a'), 1);
  t.equal(keyCardinality(['a', 'b']), 2);
  t.equal(keyCardinality([]), 0);

  t.end();
});

test('keysCompatible', t => {

  t.equal(keysCompatible(undefined, undefined), false);
  t.equal(keysCompatible(null, null), false);
  t.equal(keysCompatible([], null), false);
  t.equal(keysCompatible([], []), false);
  t.equal(keysCompatible('a', []), false);
  t.equal(keysCompatible(['a'], []), false);

  t.equal(keysCompatible('a', 'b'), true);
  t.equal(keysCompatible(['a', 'b'], ['c', 'd']), true);
  t.equal(keysCompatible(['a'], ['c']), true);

  t.end();
});

test('assertKeysCompatible', t => {

  t.throws(
    () => assertKeysCompatible({a: undefined, b: undefined}),
    TypeError
  );
  t.throws(
    () => assertKeysCompatible({a: [], b: []}),
    TypeError
  );
  t.throws(
    () => assertKeysCompatible({a: ['a'], b: ['a', 'b']}),
    TypeError
  );
  t.doesNotThrow(() => assertKeysCompatible({a: 'a', b: 'a'}));
  t.doesNotThrow(() => assertKeysCompatible({a: ['a', 'b'], b: ['a', 'b']}));

  t.end();
});

test('ensureArray', t => {

  t.deepEqual(ensureArray(), []);
  t.deepEqual(ensureArray([]), []);
  t.deepEqual(ensureArray(null), [null]);
  t.deepEqual(ensureArray('a'), ['a']);
  t.deepEqual(ensureArray([1, 2]), [1, 2]);

  t.end();
});

test('resolveObject', t => {
  t.deepEqual(resolveObject(), {});
  t.deepEqual(resolveObject({a: 'a', b: () => 'b'}), {a: 'a', b: 'b'});
  t.deepEqual(resolveObject({a: 'a', b: a => a}, 'b'), {a: 'a', b: 'b'});
  t.deepEqual(resolveObject({a: undefined, b() {}}), {});

  const X = {};
  resolveObject.call(X, { whatever() {
    t.equal(this, X, 'rebinds bound value to callback');
  } });

  t.end();
});

test('defaultsResolved', t => {
  const object = {a: 'a'};

  t.equal(defaultsResolved(object, null), object);
  t.equal(defaultsResolved(object, {}), object);
  t.equal(defaultsResolved(object, {a: 'b'}), object);

  t.deepEqual(defaultsResolved(object, null), {a: 'a'});
  t.deepEqual(defaultsResolved(object, {}), {a: 'a'});
  t.deepEqual(defaultsResolved(object, {a: 'b'}), {a: 'a'});

  t.notEqual(defaultsResolved(object, {b: 'b'}), object);

  t.deepEqual(defaultsResolved(), {});
  t.deepEqual(defaultsResolved({}), {});
  t.deepEqual(defaultsResolved({b: 'b'}, {a: 'a'}), {a: 'a', b: 'b'});
  t.deepEqual(
    defaultsResolved({a: 'a'}, {a: 'c', b: () => 'b'}),
    {a: 'a', b: 'b'}
  );

  function unnecessaryDefault() {
    t.fail('defaultsResolved should not evaluate functions unnecessarily');
  }
  t.deepEqual(
    defaultsResolved(
      { a: 'a' },
      { a: unnecessaryDefault, b: (v1, v2) => v1 + v2 },
      'd', 'e'
    ),
    {a: 'a', b: 'de'},
    `passes arguments to resolver function callbacks`
  );

  const X = {};
  defaultsResolved.call(X, undefined, { whatever() {
    t.equal(this, X, 'rebinds bound value to callback');
  } });

  t.end();
});

test('assignResolved', t => {
  const object = {a: 'a'};

  t.equal(assignResolved(object, null), object);
  t.equal(assignResolved(object, {}), object);

  t.deepEqual(assignResolved(object, null), {a: 'a'});
  t.deepEqual(assignResolved(object, {}), {a: 'a'});
  t.deepEqual(assignResolved(object, {a: 'b'}), {a: 'b'});

  t.notEqual(assignResolved(object, {b: 'b'}), object);

  t.deepEqual(assignResolved(), {});
  t.deepEqual(assignResolved({}), {});
  t.deepEqual(assignResolved({b: 'b'}, {a: 'a'}), {a: 'a', b: 'b'});
  t.deepEqual(assignResolved({b: 'b'}, {b: () => 'a'}), {b: 'a'});

  t.deepEqual(
    assignResolved(
      { a: 'a' },
      { a: (v1, v2) => v1 + v2 },
      'd', 'e'
    ),
    {a: 'de'},
    `passes arguments to resolver function callbacks`
  );

  const X = {};
  assignResolved.call(X, undefined, { whatever() {
    t.equal(this, X, 'rebinds bound value to callback');
  } });

  t.end();
});

test('flattenPairs', t => {

  t.deepEqual(
    flattenPairs({ a: 'b' }),
    [['a', 'b']]
  );

  t.deepEqual(
    flattenPairs({ a: ['b', 'c'] }),
    [['a', 'b'], ['a', 'c']]
  );

  t.deepEqual(
    flattenPairs({ a: ['b', 'c'], d: 'a' }),
    [['a', 'b'], ['a', 'c'], ['d', 'a']]
  );

  t.end();
});
