import test from 'tape';

import Mapper from '../../../lib/mapper';

test('Mapper - where', t => {

  t.test('whereIn(Mapper)', st => {

    const Things = Mapper.table('things');
    const Others = Mapper.table('others');

    st.throws(
      () => Things.whereIn('attribute', Others),
      TypeError,
      'throws `TypeError` when Mapper has no columns specified'
    );

    const OthersColumn = Others.query(q => q.select('column'));

    st.doesNotThrow(
      () => Things.whereIn('attribute', OthersColumn),
      TypeError,
      'does not throw `TypeError` when Mapper has columns specified'
    );

    st.queriesEqual(
      Things.whereIn('attribute', OthersColumn).toQueryBuilder(),
      `select * from "things"
      where "things"."attribute" in (
        select "column" from "others"
      )`,
      'generates correct `where in` clause - single attribute'
    );


    const OthersColumns = Others.query(q => q.select('o_a', 'o_b'));

    st.skip('blocked by knex issue #1384', () => {
      st.queriesEqual(
        Things.whereIn(['a', 'b'], OthersColumns).toQueryBuilder(),
        `select * from "things"
        where ("things"."a", "things"."b") in (
          select "o_a", "o_b" from "others"
        )`,
        'generates correct `where in` clause - multiple attributes'
      );
    });

    st.end();

  });
});
