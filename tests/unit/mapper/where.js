import test from 'tape';

import Mapper from '../../../lib/mapper';

test('Mapper - where', t => {

  t.test('where(attribute, value)', st => {

    const Things = Mapper.table('things').where('a', 'A');

    st.queriesEqual(
      Things.prepareFetch().toQueryBuilder(),
      `select "things".* from "things" where "things"."a" = 'A'`
    );

    st.deepEqual(Things.forge(), { a: 'A' });

    st.end();
  });

  t.test(`where(attribute, '=', value)`, st => {

    const Things = Mapper.table('things').where('a', '=', 'A');

    st.queriesEqual(
      Things.prepareFetch().toQueryBuilder(),
      `select "things".* from "things" where "things"."a" = 'A'`
    );

    st.deepEqual(Things.forge({ a: 'overridden' }), { a: 'A' });

    st.end();
  });

  t.test(`where({ table: attribute }, value)`, st => {

    const Others = Mapper.table('others');
    const Things = Mapper.table('things')
      .join(Others, 'a', 'b')
      .where({ others: 'a' }, 'A');

    st.queriesEqual(
      Things.prepareFetch().toQueryBuilder(), `
        select "things".* from "things"
        inner join "others" on "things"."a" = "others"."b"
        where "others"."a" = 'A'`
    );

    st.end();
  });

  t.test(`where({ [attribute], value })`, st => {

    const Things = Mapper.table('things').where({ a: 'A', b: 'B' });

    st.queriesEqual(
      Things.prepareFetch().toQueryBuilder(),
      `select "things".* from "things"
      where "things"."a" = 'A' and "things"."b" = 'B'`
    );

    st.deepEqual(Things.forge({ a: 'overridden' }), { a: 'A', b: 'B' });

    st.end();
  });

  t.test(`where(attributes[], values[])`, st => {

    const Things = Mapper.table('things').where(['a', 'b'], ['A', 'B']);

    st.queriesEqual(
      Things.prepareFetch().toQueryBuilder(),
      `select "things".* from "things"
      where "things"."a" = 'A' and "things"."b" = 'B'`
    );

    st.deepEqual(Things.forge({ a: 'overridden' }), { a: 'A', b: 'B' });

    st.end();
  });


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
