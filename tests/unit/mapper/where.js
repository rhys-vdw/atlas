import test from 'tape';

import Mapper from '../../../lib/mapper';

test('Mapper - where', t => {

  t.test('whereIn(Mapper)', st => {

    const Things = Mapper.table('things');
    const Others = Mapper.table('others');

    st.queriesEqual(
      Things.whereIn('attribute', Others).toQueryBuilder(),
      `select * from "things"
      where "things"."attribute" in (
        select "others"."attribute" from "others"
      )`,
      'generates correct `where in` clause - single attribute'
    );

    const OthersColumn = Others.query(q => q.select('column'));

    st.queriesEqual(
      Things.whereIn('attribute', OthersColumn).toQueryBuilder(),
      `select * from "things"
      where "things"."attribute" in (
        select "column" from "others"
      )`,
      'generates correct `where in` clause - mapper has specified column'
    );

    st.skip('blocked by knex issue #1384', () => {

      st.queriesEqual(
        Things.whereIn(['a', 'b'], Others).toQueryBuilder(),
        `select * from "things"
        where ("things"."a", "things"."b") in (
          select "a", "b" from "others"
        )`,
        'generates correct `where in` clause - multiple attributes'
      );

      const OthersColumns = Others.query(q => q.select('o_a', 'o_b'));

      st.queriesEqual(
        Things.whereIn(['a', 'b'], OthersColumns).toQueryBuilder(),
        `select * from "things"
        where ("things"."a", "things"."b") in (
          select "o_a", "o_b" from "others"
        )`,
        'generates correct `where in` clause - mapper has specified column'
      );
    });

    st.end();

  });
});
