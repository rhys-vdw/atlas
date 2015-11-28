import test from 'tape';
import Mapper from '../../../lib/mapper';

test('== Mapper - defaults ==', t => {

  t.test('Mapper.defaultAttribute', st => {

    const fn = () => 'fn';

    const A = Mapper.defaultAttribute('key', 'value');
    const B = Mapper.defaultAttribute(['keyA', 'keyB'], ['valueA', 'valueB']);
    const C = Mapper.defaultAttribute('fnKey', fn);
    const D = Mapper.defaultAttribute(['key', 'fnKey'], ['value', fn]);
    const E = Mapper
      .defaultAttribute('keyA', 'valueA')
      .defaultAttribute('keyB', 'valueB');

    st.deepEqual(A.getOption('defaultAttributes'), {key: 'value'});
    st.deepEqual(B.getOption('defaultAttributes'),
      {keyA: 'valueA', keyB: 'valueB'}
    );
    st.deepEqual(C.getOption('defaultAttributes'), {fnKey: fn});
    st.deepEqual(D.getOption('defaultAttributes'), {key: 'value', fnKey: fn});
    st.deepEqual(E.getOption('defaultAttributes'),
      {keyA: 'valueA', keyB: 'valueB'}
    );

    st.end();
  });

  t.test('Mapper.defaultAttributes', st => {

    const fn = () => 'fn';

    const A = Mapper.defaultAttributes({key: 'value'});
    const B = Mapper.defaultAttributes({key: 'value', fn: fn});
    const C = Mapper
      .defaultAttributes({keyA: 'valueA'})
      .defaultAttributes({keyB: 'valueB'});

    st.deepEqual(A.getOption('defaultAttributes'), {key: 'value'});
    st.deepEqual(B.getOption('defaultAttributes'),
      {key: 'value', fn: fn}
    );
    st.deepEqual(C.getOption('defaultAttributes'),
      {keyA: 'valueA', keyB: 'valueB'}
    );

    st.end();
  });

  t.test('Mapper.strictAttribute', st => {

    const fn = () => 'fn';

    const A = Mapper.strictAttribute('key', 'value');
    const B = Mapper.strictAttribute(['keyA', 'keyB'], ['valueA', 'valueB']);
    const C = Mapper.strictAttribute('fnKey', fn);
    const D = Mapper.strictAttribute(['key', 'fnKey'], ['value', fn]);
    const E = Mapper
      .strictAttribute('keyA', 'valueA')
      .strictAttribute('keyB', 'valueB');

    st.deepEqual(A.getOption('strictAttributes'), {key: 'value'});
    st.deepEqual(B.getOption('strictAttributes'),
      {keyA: 'valueA', keyB: 'valueB'}
    );
    st.deepEqual(C.getOption('strictAttributes'), {fnKey: fn});
    st.deepEqual(D.getOption('strictAttributes'), {key: 'value', fnKey: fn});
    st.deepEqual(E.getOption('strictAttributes'),
      {keyA: 'valueA', keyB: 'valueB'}
    );

    st.end();
  });

  t.test('Mapper.strictAttributes', st => {

    const fn = () => 'fn';

    const A = Mapper.strictAttributes({key: 'value'});
    const B = Mapper.strictAttributes({key: 'value', fn: fn});
    const C = Mapper
      .strictAttributes({keyA: 'valueA'})
      .strictAttributes({keyB: 'valueB'});

    st.deepEqual(A.getOption('strictAttributes'), {key: 'value'});
    st.deepEqual(B.getOption('strictAttributes'),
      {key: 'value', fn: fn}
    );
    st.deepEqual(C.getOption('strictAttributes'),
      {keyA: 'valueA', keyB: 'valueB'}
    );

    st.end();
  });

});
