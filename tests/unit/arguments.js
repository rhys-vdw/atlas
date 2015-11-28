import test from 'tape';

import {
  assignResolved, assertKeysCompatible, ensureArray, defaultsResolved,
  keyCardinality, keysCompatible, resolveObject
} from '../../lib/arguments';

test('Arguments', t => {

  t.test('keyCardinality', st => {

    st.equal(keyCardinality(null), 0);
    st.equal(keyCardinality('a'), 1);
    st.equal(keyCardinality(['a', 'b']), 2);
    st.equal(keyCardinality([]), 0);

    st.end();
  });

  t.test('keysCompatible', st => {

    st.equal(keysCompatible(undefined, undefined), false);
    st.equal(keysCompatible(null, null), false);
    st.equal(keysCompatible([], null), false);
    st.equal(keysCompatible([], []), false);
    st.equal(keysCompatible('a', []), false);
    st.equal(keysCompatible(['a'], []), false);

    st.equal(keysCompatible('a', 'b'), true);
    st.equal(keysCompatible(['a', 'b'], ['c', 'd']), true);
    st.equal(keysCompatible(['a'], ['c']), true);

    st.end();
  });

  t.test('assertKeysCompatible', st => {

    st.throws(
      () => assertKeysCompatible({a: undefined, b: undefined}),
      TypeError
    );
    st.throws(
      () => assertKeysCompatible({a: [], b: []}),
      TypeError
    );
    st.throws(
      () => assertKeysCompatible({a: ['a'], b: ['a', 'b']}),
      TypeError
    );
    st.doesNotThrow(() => assertKeysCompatible({a: 'a', b: 'a'}));
    st.doesNotThrow(() => assertKeysCompatible({a: ['a', 'b'], b: ['a', 'b']}));

    st.end();
  });

  t.test('ensureArray', st => {

    st.deepEqual(ensureArray(), []);
    st.deepEqual(ensureArray([]), []);
    st.deepEqual(ensureArray(null), [null]);
    st.deepEqual(ensureArray('a'), ['a']);
    st.deepEqual(ensureArray([1, 2]), [1, 2]);

    st.end();
  });

  t.test('resolveObject', st => {
    st.deepEqual(resolveObject(), {});
    st.deepEqual(resolveObject({a: 'a', b: () => 'b'}), {a: 'a', b: 'b'});

    st.end();
  });

  t.test('defaultsResolved', st => {
    const object = {a: 'a'};

    st.equal(defaultsResolved(object, null), object);
    st.equal(defaultsResolved(object, {}), object);
    st.equal(defaultsResolved(object, {a: 'b'}), object);

    st.deepEqual(defaultsResolved(object, null), {a: 'a'});
    st.deepEqual(defaultsResolved(object, {}), {a: 'a'});
    st.deepEqual(defaultsResolved(object, {a: 'b'}), {a: 'a'});

    st.notEqual(defaultsResolved(object, {b: 'b'}), object);

    st.deepEqual(defaultsResolved(), {});
    st.deepEqual(defaultsResolved({}), {});
    st.deepEqual(defaultsResolved({b: 'b'}, {a: 'a'}), {a: 'a', b: 'b'});
    st.deepEqual(
      defaultsResolved({a: 'a'}, {a: 'c', b: () => 'b'}),
      {a: 'a', b: 'b'}
    );

    st.end();
  });

  t.test('assignResolved', st => {
    const object = {a: 'a'};

    st.equal(assignResolved(object, null), object);
    st.equal(assignResolved(object, {}), object);

    st.deepEqual(assignResolved(object, null), {a: 'a'});
    st.deepEqual(assignResolved(object, {}), {a: 'a'});
    st.deepEqual(assignResolved(object, {a: 'b'}), {a: 'b'});

    st.notEqual(assignResolved(object, {b: 'b'}), object);

    st.deepEqual(assignResolved(), {});
    st.deepEqual(assignResolved({}), {});
    st.deepEqual(assignResolved({b: 'b'}, {a: 'a'}), {a: 'a', b: 'b'});
    st.deepEqual(assignResolved({b: 'b'}, {b: () => 'a'}), {b: 'a'});

    st.end();
  });

});
