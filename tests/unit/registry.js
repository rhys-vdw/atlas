import test from 'tape';
import Registry from '../../lib/registry';
import { RegisteredKeyError, UnregisteredKeyError } from '../../lib/errors';

test('Registry', t => {

  t.test('Registry#register()', t => {
    const registry = new Registry();
    const instance = { name: 'instance' };

    t.equal(
      registry.register('test', instance), instance,
      'returns instance on register'
    );

    t.throws(
      () => registry.register('test', {}),
      RegisteredKeyError,
      'disallows registration with duplicate key'
    );

    t.equal(
      registry.retrieve('test'), instance,
      'registered instance is retrieved'
    );

    t.end();
  });

  t.test('Registry#override()', t => {
    const registry = new Registry();

    const a = { name: 'a' };
    const b = { name: 'b' };

    t.throws(
      () => registry.override('test', a),
      UnregisteredKeyError,
      'disallows overriding key that is not yet registered'
    );

    registry.register('test', a);

    t.equal(
      registry.override('test', b), b,
      'returns registered instance'
    );

    t.equal(
      registry.retrieve('test'), b,
      'overiding instance is retrieved'
    );

    t.end();
  });

  t.end();
});
