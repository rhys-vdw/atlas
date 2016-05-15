import test from 'tape';
import { omit } from 'lodash';

import ImmutableBase from '../../lib/immutable-base';

test('ImmutableBase', t => {

  t.test('ImmutableBase#setState()', t => {

    const before = new ImmutableBase();
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

  t.test('ImmutableBase#extend()', t => {

    const methods = {
      a: function() {},
      b: function() {},
      c: function() {},
    };

    const parent = new ImmutableBase()
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

  t.test('ImmutableBase#extend(callback)', t => {

    const parent = new ImmutableBase().extend({
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

  t.test('ImmutableBase#extend(...args) - multiple arguments', st => {

    function a() {}
    function b() {}
    function c() {}

    const parent = new ImmutableBase()
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


  t.test('ImmutableBase#asMutable(), ImmutableBase#asImmutable()', t => {

    const KEY = 'KEY';
    const VALUE_A = 'VALUE_A';
    const VALUE_B = 'VALUE_B';

    const options = new ImmutableBase({ a: 'a', b: 'b' });

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

    const withOption = mutable.setState({ [KEY]: VALUE_A });

    t.equal(
      mutable, withOption,
      '`setState` on a mutable instance does not return a copy'
    );

    t.equal(
      withOption.requireState(KEY), VALUE_A,
      '`setState` correctly sets value on mutable instance'
    );

    const immutable = mutable.asImmutable();

    t.equal(
      mutable, immutable,
      '`asImmutable` returns the same instance'
    );

    const immutableWithOption = immutable.setState({ [KEY]: VALUE_B });

    t.notEqual(
      immutable, immutableWithOption,
      '`setState` returns a copy on an immutable instance that was ' +
      'previously mutable...'
    );

    t.equal(
      immutableWithOption.requireState(KEY), VALUE_B,
      '...new instance is set correctly...'
    );

    t.equal(
      immutable.requireState(KEY), VALUE_A,
      '...previous instance remains unchanged.'
    );

    t.end();
  });

  t.test('ImmutableBase#withMutations()', t => {

    const KEY = 'KEY';
    const VALUE = 'VALUE';

    const options = new ImmutableBase();

    t.equal(
      options, options.withMutations(),
      'returns self with no arguments'
    );

    t.equal(
      options, options.withMutations({}),
      'returns self with an empty initializer object'
    );

    let mutatedOnce = null;

    const result = options.withMutations(scopedMutable => {

      mutatedOnce = scopedMutable.setState({ [KEY]: VALUE });

      t.equal(
        mutatedOnce, scopedMutable,
        'callback argument is mutable'
      );

    });

    t.equal(
      mutatedOnce, result,
      'mutated instance is returned from `withMutations`'
    );

    t.equal(
      result.isMutable(), false,
      'returned mutated instance is no longer mutable'
    );

    const mutable = new ImmutableBase().asMutable();

    const alreadyMutableResult = mutable.withMutations(alreadyMutable => {
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

  t.test('ImmutableBase#withMutations() - multiple initializers', t => {

    const original = new ImmutableBase();

    const mutated = original.withMutations(
      b => b.setState({ a: 'a' }),
      { setState: { b: 'b' } }
    );

    t.notEqual(
      mutated, original, 'mutated instance is not original'
    );

    t.deepEqual(
      mutated.state, { a: 'a', b: 'b', isMutable: false },
      'mutated instance has expected state'
    );

    t.end();
  });

  t.test('ImmutableBase#withMutations() - string initializers', t => {

    const original = new ImmutableBase().extend({
      a() { return this.setState({ a: true }); },
      b() { return this.setState({ b: true }); }
    });

    const mutated = original.withMutations('a', 'b', { setState: { c: true } });

    t.notEqual(original, mutated, 'mutated instance is copy');

    t.deepEqual(
      mutated.state, { a: true, b: true, c: true, isMutable: false },
      'state is as expected'
    );

    t.end();
  });

  t.test('ImmutableBase#withMutations() - array of initializers', t => {

    const original = new ImmutableBase().extend({
      a() { return this.setState({ a: true }); },
      b() { return this.setState({ b: true }); }
    });

    const mutated = original.withMutations(
      [['a', 'b', { setState: { c: true } }]]
    );

    t.notEqual(original, mutated, 'mutated instance is copy');

    t.deepEqual(
      mutated.state, { a: true, b: true, c: true, isMutable: false },
      'state is as expected'
    );

    t.end();
  });
});
