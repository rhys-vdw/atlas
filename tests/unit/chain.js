import test from 'tape';
import { omit } from 'lodash';

import Chain from '../../lib/chain';

test('new Chain()', t => {
  t.deepEqual(
    new Chain().state,
    { isMutable: false },
    'default to immutable'
  );

  t.end();
});

test('new Chain({})', t => {
  const arg = { k: 'v' };
  const { state } = new Chain(arg);

  t.deepEqual(state, { k: 'v', isMutable: false }, 'defaults to immutable');
  t.notEqual(state, arg, 'does not mutate original');

  t.end();
});

test('new Chain({ isMutable })', t => {
  const arg = { k: 'v', isMutable: false };
  const { state } = new Chain(arg);

  t.deepEqual(state, { k: 'v', isMutable: false }, 'correct state');
  t.equal(state, arg, 'does not unnecessarily copy original');

  t.end();
});

test('Chain#setState()', t => {

  const before = new Chain();
  const after = before.setState({ testKey: 'testValue' });


  t.notEqual(
    before, after,
    'should create a copy'
  );

  t.notEqual(
    before.state, after.state,
    'should have a different options object'
  );

  t.equal(
    after, after.setState({ testKey: 'testValue' }),
    'should not copy when reassigning the same value'
  );

  t.equal(
    after.state['testKey'], 'testValue',
    'has correct state'
  );

  t.throws(
    () => before.requireState('testKey'),
    'should leave original unchanged (throws on `requireState`)'
  );

  t.end();
});

test('Chain#asMutable(), Chain#asImmutable()', t => {

  const options = new Chain({ a: 'a', b: 'b' });

  t.equal(
    options, options.asImmutable(),
    '`asImmutable` is a no-op on an immutable instance'
  );

  const mutable = options.asMutable();

  t.notEqual(
    options, mutable,
    '`asMutable` creates a copy of an immutable instance'
  );

  t.notEqual(
    options.state, mutable.state,
    'mutable copy has a different `state` instance'
  );

  t.deepEqual(
    omit(options.state, 'isMutable'),
    omit(mutable.state, 'isMutable'),
    'mutable copy has the same options set (other than `isMutable`)'
  );

  t.equal(
    mutable, mutable.asMutable(),
    '`asMutable` is a no-op on a mutable instance'
  );

  const withOption = mutable.setState({ key: 'a' });

  t.equal(
    mutable, withOption,
    '`setState` on a mutable instance does not return a copy'
  );

  t.equal(
    withOption.requireState('key'), 'a',
    '`setState` correctly sets value on mutable instance'
  );

  const immutable = mutable.asImmutable();

  t.equal(
    mutable, immutable,
    '`asImmutable` returns the same instance'
  );

  const immutableWithOption = immutable.setState({ key: 'b' });

  t.notEqual(
    immutable, immutableWithOption,
    '`setState` returns a copy on an immutable instance that was ' +
    'previously mutable...'
  );

  t.equal(
    immutableWithOption.requireState('key'), 'b',
    '...new instance is set correctly...'
  );

  t.equal(
    immutable.requireState('key'), 'a',
    '...previous instance remains unchanged.'
  );

  t.end();
});

test('Chain#mutate()', t => {

  const options = new Chain();

  t.equal(
    options, options.mutate(),
    'returns self with no arguments'
  );

  let mutatedOnce = null;

  const result = options.mutate(scopedMutable => {

    mutatedOnce = scopedMutable.setState({ key: 'value' });

    t.equal(
      mutatedOnce, scopedMutable,
      'callback argument is mutable'
    );

  });

  t.equal(
    mutatedOnce, result,
    'mutated instance is returned from `mutate`'
  );

  t.equal(
    result.isMutable(), false,
    'returned mutated instance is no longer mutable'
  );

  const mutable = new Chain().asMutable();

  const alreadyMutableResult = mutable.mutate(alreadyMutable => {
    t.equal(
      mutable, alreadyMutable,
      'callback is original instance if already mutable'
    );
  });

  t.equal(
    mutable, alreadyMutableResult,
    'returned instance is original instance if already mutable'
  );

  t.equal(
    alreadyMutableResult.isMutable(), true,
    'returned instance retains its original mutability'
  );

  t.end();
});

test('class extends Chain', t => {

  class Child extends Chain {
    initialize() {
      this.setState({ a: 'a' });
      this.setState({ b: 'b' });
    }
  }

  t.deepEqual(
    new Child().state,
    { a: 'a', b: 'b', isMutable: false },
    'runs overridden `initialize`'
  );

  t.end();
});

test('Chain#extend()', t => {

  const methods = {
    a: function() {},
    b: function() {},
    c: function() {},
  };

  const parent = new Chain()
    .setState({ testKey: 'testValue' });

  const child = parent.extend(methods);

  t.notEqual(
    child.constructor, parent.constructor,
    'child and parent have different classes'
  );

  t.ok(
    child instanceof parent.constructor,
    'child is an instance of parent type'
  );

  t.ok(
    child.a === methods.a &&
    child.b === methods.b &&
    child.c === methods.c,
    'child has assigned methods'
  );

  t.equal(
    child.requireState('testKey'), 'testValue',
    'child has parent options'
  );

  t.end();
});

test('Chain#extend(callback)', t => {

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

  t.equal(parent.lineage(), `Parent`);
  t.equal(child.lineage(), `Child <- Parent`);
  t.equal(grandchild.lineage(),
    `Grandchild <- Child <- Parent`
  );

  t.end();
});

test('Chain#extend(...args) - multiple arguments', t => {

  function a() {}
  function b() {}
  function c() {}

  const parent = new Chain()
    .setState({ testKey: 'testValue' });

  const child = parent.extend({ a }, { b }, callSuper => ({ c }));

  t.notEqual(
    child.constructor, parent.constructor,
    'child and parent have different classes'
  );

  t.equal(
    Object.getPrototypeOf(Object.getPrototypeOf(child)),
    parent.constructor.prototype,
    'child type directly inherits from parent type'
  );

  t.ok(
    child.a === a &&
    child.b === b &&
    child.c === c,
    'child has assigned methods'
  );

  t.equal(
    child.requireState('testKey'), 'testValue',
    'child has parent options'
  );

  t.end();
});


