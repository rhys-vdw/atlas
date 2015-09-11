import test from 'tape-catch';
import { each } from 'lodash/collection';

import Knex from 'knex';
import Mapper from '../lib/mapper';

const knex = Knex({});

test('Mapper', (t) => {

  t.test('constructor', (t) => {

    const mapper = new Mapper();

    t.equal(mapper._mutable, false, 'is immutable');
    t.equal(mapper._query, null, 'query is null');
    t.ok(mapper._options.isEmpty(), 'no options');

    t.end();
  });

  t.test('setOption, getOption', (t) => {
    const OPTION = 'testOption';
    const VALUE = 'testValue';

    const before = new Mapper();
    const after = before.setOption(OPTION, VALUE);

    t.notEqual(
      before, after,
      'should copy Mapper'
    );

    t.equal(
      after, after.setOption(OPTION, VALUE),
      'should not copy when reassigning the same value'
    );

    t.equal(
      after.getOption(OPTION), VALUE,
      'should be retrievable via `getOption`'
    );

    t.throws(
      () => before.getOption(OPTION),
      'should leave original unchanged (throws on `getOption`)'
    );

    t.end();
  });

  t.test('getOptions', (t) => {

    const mapper = new Mapper()
      .setOption('a', 'a')
      .setOption('b', 'b')
      .setOption('c', 'c')
      .setOption('d', 'd');

    t.deepEqual(
      mapper.getOptions('a', 'b', 'd'),
      { a: 'a', b: 'b', d: 'd' },
      'can retrieve with varargs syntax'
    );

    t.deepEqual(
      mapper.getOptions(['a', 'c']),
      { a: 'a', c: 'c' },
      'can retrieve with array syntax'
    );

    t.end();
  });

  t.test('extend', (t) => {
    const OPTION = 'testOption';
    const VALUE = 'testValue';

    const parent = new Mapper()
      .setOption(OPTION, VALUE);

    const methods = {
      a: function() {},
      b: function() {},
      c: function() {},
    }

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
      child.getOption(OPTION), VALUE,
      'child has parent options'
    );

    t.end();
  });


  t.end();
});
