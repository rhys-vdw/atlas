import test from 'tape';
import { omit } from 'lodash';

import Chain from '../../lib/chain';

test('Chain#setState()', st => {

  const before = new Chain();
  const after = before.setState({ testKey: 'testValue' });

  st.notEqual(
    before, after,
    'should create a copy'
  );

  st.notEqual(
    before.state, after.state,
    'should have a different options object'
  );

  st.equal(
    after, after.setState({ testKey: 'testValue' }),
    'should not copy when reassigning the same value'
  );

  st.equal(
    after.state['testKey'], 'testValue',
    'has correct state'
  );

  st.throws(
    () => before.requireState('testKey'),
    'should leave original unchanged (throws on `requireState`)'
  );

  st.end();
});

test('Chain#extend()', st => {

  const methods = {
    a: function() {},
    b: function() {},
    c: function() {},
  };

  const parent = new Chain()
    .setState({ testKey: 'testValue' });

  const child = parent.extend(methods);

  st.notEqual(
    child.constructor, parent.constructor,
    'child and parent have different classes'
  );

  st.ok(
    child instanceof parent.constructor,
    'child is an instance of parent type'
  );

  st.ok(
    child.a === methods.a &&
    child.b === methods.b &&
    child.c === methods.c,
    'child has assigned methods'
  );

  st.equal(
    child.requireState('testKey'), 'testValue',
    'child has parent options'
  );

  st.end();
});

test('Chain#extend(callback)', st => {

  const parent = new Chain().extend({
    lineage() { return `Parent`; }
  });

  const child = parent.extend(callSuper => ({
    lineage() {
      return `Child <- ${callSuper(this, 'lineage')}`;
    }
  }));

  const grandchild = child.extend(callSuper => ({
    lineage() {
      return `Grandchild <- ${callSuper(this, 'lineage')}`;
    }
  }));

  st.equal(parent.lineage(), `Parent`);
  st.equal(child.lineage(), `Child <- Parent`);
  st.equal(grandchild.lineage(),
    `Grandchild <- Child <- Parent`
  );

  st.end();
});

test('Chain#extend(...args) - multiple arguments', st => {

  function a() {}
  function b() {}
  function c() {}

  const parent = new Chain()
    .setState({ testKey: 'testValue' });

  const child = parent.extend({ a }, { b }, callSuper => ({ c }));

  st.notEqual(
    child.constructor, parent.constructor,
    'child and parent have different classes'
  );

  st.equal(
    Object.getPrototypeOf(Object.getPrototypeOf(child)),
    parent.constructor.prototype,
    'child type directly inherits from parent type'
  );

  st.ok(
    child.a === a &&
    child.b === b &&
    child.c === c,
    'child has assigned methods'
  );

  st.equal(
    child.requireState('testKey'), 'testValue',
    'child has parent options'
  );

  st.end();
});


test('Chain#asMutable(), Chain#asImmutable()', st => {

  const options = new Chain({ a: 'a', b: 'b' });

  st.equal(
    options, options.asImmutable(),
    '`asImmutable` is a no-op on an immutable instance'
  );

  const mutable = options.asMutable();

  st.notEqual(
    options, mutable,
    '`asMutable` creates a copy of an immutable instance'
  );

  st.notEqual(
    options.state, mutable.state,
    'mutable copy has a different `state` instance'
  );

  st.deepEqual(
    omit(options.state, 'isMutable'),
    omit(mutable.state, 'isMutable'),
    'mutable copy has the same options set (other than `isMutable`)'
  );

  st.equal(
    mutable, mutable.asMutable(),
    '`asMutable` is a no-op on a mutable instance'
  );

  const withOption = mutable.setState({ key: 'a' });

  st.equal(
    mutable, withOption,
    '`setState` on a mutable instance does not return a copy'
  );

  st.equal(
    withOption.requireState('key'), 'a',
    '`setState` correctly sets value on mutable instance'
  );

  const immutable = mutable.asImmutable();

  st.equal(
    mutable, immutable,
    '`asImmutable` returns the same instance'
  );

  const immutableWithOption = immutable.setState({ key: 'b' });

  st.notEqual(
    immutable, immutableWithOption,
    '`setState` returns a copy on an immutable instance that was ' +
    'previously mutable...'
  );

  st.equal(
    immutableWithOption.requireState('key'), 'b',
    '...new instance is set correctly...'
  );

  st.equal(
    immutable.requireState('key'), 'a',
    '...previous instance remains unchanged.'
  );

  st.end();
});

test('Chain#mutate()', st => {

  const options = new Chain();

  st.equal(
    options, options.mutate(),
    'returns self with no arguments'
  );

  let mutatedOnce = null;

  const result = options.mutate(scopedMutable => {

    mutatedOnce = scopedMutable.setState({ key: 'value' });

    st.equal(
      mutatedOnce, scopedMutable,
      'callback argument is mutable'
    );

  });

  st.equal(
    mutatedOnce, result,
    'mutated instance is returned from `mutate`'
  );

  st.equal(
    result.isMutable(), false,
    'returned mutated instance is no longer mutable'
  );

  const mutable = new Chain().asMutable();

  const alreadyMutableResult = mutable.mutate(alreadyMutable => {
    st.equal(
      mutable, alreadyMutable,
      'callback is original instance if already mutable'
    );
  });

  st.equal(
    mutable, alreadyMutableResult,
    'returned instance is original instance if already mutable'
  );

  st.equal(
    alreadyMutableResult.isMutable(), true,
    'returned instance retains its original mutability'
  );

  st.end();
});
