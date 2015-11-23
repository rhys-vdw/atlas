import test from 'tape';

import {
  assertKeysCompatible, ensureArray, keyCardinality, keysCompatible
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

});
