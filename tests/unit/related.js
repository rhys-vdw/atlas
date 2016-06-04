import test from 'tape';

import Related, { related } from '../../lib/related';
import BelongsTo from '../../lib/relations/belongs-to';
import Mapper from '../../lib/mapper/index';

test('Arguments', t => {

  t.test('related() - invalid', st => {

    st.throws(() => related(), TypeError);
    st.throws(() => related(null), TypeError);
    st.throws(() => related(5), TypeError);

    st.end();
  });

  t.test('related(string)', st => {

    const result = related('hello');

    st.ok(result instanceof Related, 'returns instance of `Related`');

    st.equal(related('hello').requireState('name'), 'hello', 'assigns name');

    st.end();
  });

  t.test('related(Related)', st => {
    const self = new Related();
    st.equal(related(self), self, 'returns self');

    st.end();
  });

  t.test('related(BelongsTo)', st => {

    const Records = Mapper.table('records');
    const recordRelation = new BelongsTo(Records, Records);

    const result = related(recordRelation);

    st.ok(result instanceof Related, 'returns instance of `Related`');

    st.equal(
      result.getRelation(), recordRelation,
      'sets correct relation'
    );

    st.end();
  });

});
