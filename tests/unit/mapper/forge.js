import test from 'tape';
import Mapper from '../../../lib/mapper';

test('== Mapper - forge ==', t => {
  t.test('Mapper.forge()', st => {

    st.deepEqual(
      Mapper.forge(), {},
      'Forges empty object'
    );
    st.deepEqual(
      Mapper.forge([null, undefined]), [{}, {}],
      'Forges empty objects'
    );
    st.deepEqual(
      Mapper.forge({ a: 'a', b: 'b' }),
      { a: 'a', b: 'b' },
      'Forges single record'
    );
    st.deepEqual(
      Mapper.forge([{ a: 'a'}, { b: 'b' }]),
      [{ a: 'a'}, { b: 'b' }],
      'Forges array or records'
    );

    st.throws(() => Mapper.forge(5), TypeError);
    st.throws(() => Mapper.forge('ksldjf'), TypeError);
    st.throws(() => Mapper.forge([1]), TypeError);

    st.end();
  });

  t.test('Mapper.defaultAttributes().forge()', st => {
    const DefaultMapper = Mapper.setState({
      test_state: 'test_value'
    }).defaultAttributes({
      a: 'default',
      b: 'default',
      c(attributes) {
        return this.requireState('test_state') + '/' + attributes.b;
      }
    });

    st.deepEqual(
      DefaultMapper.forge({ b: 'set' }),
      { a: 'default', b: 'set', c: 'test_value/set' }
    );

    st.end();
  });

  t.test('Mapper.strictAttributes().forge()', st => {
    const StrictMapper = Mapper.setState({
      test_state: 'test_value'
    }).strictAttributes({
      a: 'strict',
      b: 'strict',
      c(attributes) {
        return this.requireState('test_state') + '/' + attributes.b;
      }
    });

    st.deepEqual(
      StrictMapper.forge({ b: 'set' }),
      { a: 'strict', b: 'strict', c: 'test_value/set' }
    );

    st.end();
  });

  t.test('Mapper.defaultAttributes().strictAttributes().forge()', st => {
    const StrictDefaultMapper = Mapper.defaultAttributes({
      b: 'b'
    }).strictAttributes({
      a: 'a', b: 'a', c: attributes => `${attributes.b}c`
    });

    st.deepEqual(
      StrictDefaultMapper.forge(),
      { a: 'a', b: 'a', c: 'bc' }
    );

    st.end();
  });

});
