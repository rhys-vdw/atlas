import test from 'tape';
import Atlas, { plugins } from '../../../lib/atlas';
import Mapper from '../../../lib/mapper';
const { Timestamp } = Atlas.plugins;

test('Timestamp plugin', t => {
  t.test('insert()', st => {

    const TimestampMapper = Mapper.table('records')
      .extend(Timestamp({ createdAt: 'made_at', getNow: () => '2016-10-10' }));

    st.queriesEqual(
      TimestampMapper.prepareInsert({ name: 'Bob' }).toQueryBuilder(), `
      insert into "records" ("made_at", "name", "updated_at")
      values ('2016-10-10', 'Bob', '2016-10-10')
    `, 'sets both `created_at` and `updated_at`'
    );

    st.queriesEqual(
      TimestampMapper.omitTimestamps()
        .prepareInsert({ name: 'Bob' })
        .toQueryBuilder(), `
      insert into "records" ("name")
      values ('Bob')
    `, 'sets neither with `omitTimestamps`'
    );

    st.end();
  });

  t.test('update()', st => {

    const TimestampMapper = Mapper.table('records')
      .extend(Timestamp({ getNow: () => '2016-10-10' }));

    const record = {
      id: 5,
      name: 'Bob',
      created_at: '2014-02-02',
      updated_at: '2015-03-03'
    };

    st.queriesEqual(
      TimestampMapper.prepareUpdate(record).toQueryBuilder(), `
      update "records"
      set
        "created_at" = '2014-02-02',
        "name" = 'Bob',
        "updated_at" = '2016-10-10'
      where "id" = 5
    `, 'updates `updated_at`'
    );

    st.queriesEqual(
      TimestampMapper
        .omitTimestamps()
        .prepareUpdate(record)
        .toQueryBuilder(), `
      update "records"
      set
        "created_at" = '2014-02-02',
        "name" = 'Bob',
        "updated_at" = '2015-03-03'
      where "id" = 5
    `, 'updates neither with `omitTimestamps`'
    );

    st.end();
  });


  t.test('update()', st => {

    const TimestampMapper = Mapper.table('records')
      .extend(Timestamp({ getNow: () => '2016-10-10' }));

    st.deepEqual(
      TimestampMapper.forge({ name: 'Bob' }),
      { name: 'Bob', created_at: '2016-10-10', updated_at: '2016-10-10' },
      'forges new records with timestamps'
    );

    st.deepEqual(
      TimestampMapper.omitTimestamps().forge({ name: 'Bob' }),
      { name: 'Bob' },
      'does not include timestamps with `omitTimestamps`'
    );

    st.end();
  });

  t.test('created helpers', st => {

    const TimestampMapper = Mapper.table('records')
      .extend(Timestamp({ getNow: () => '2016-10-10' }));

    const fetchBefore = TimestampMapper.createdBefore('2015-10-10')
      .prepareFetch();

    st.queriesEqual(
      fetchBefore.toQueryBuilder(), `
        select "records".*
        from "records"
        where "records"."created_at" < '2015-10-10'
      `, '`createdBefore`'
    );

    const fetchAfter = TimestampMapper.createdAfter('2015-10-10')
      .prepareFetch();

    st.queriesEqual(
      fetchAfter.toQueryBuilder(), `
        select "records".*
        from "records"
        where "records"."created_at" > '2015-10-10'
      `, '`createdAfter`'
    );

    const fetchBetween = TimestampMapper
      .createdBetween('2014-10-10', '2015-10-10')
      .prepareFetch();

    st.queriesEqual(
      fetchBetween.toQueryBuilder(), `
        select "records".*
        from "records"
        where "records"."created_at" > '2014-10-10'
        and "records"."created_at" < '2015-10-10'
      `, '`createdBetween`'
    );

    st.end();
  });

  t.test('updated helpers', st => {

    const TimestampMapper = Mapper.table('records')
      .extend(Timestamp({ getNow: () => '2016-10-10' }));

    const fetchBefore = TimestampMapper.updatedBefore('2015-10-10')
      .prepareFetch();

    st.queriesEqual(
      fetchBefore.toQueryBuilder(), `
        select "records".*
        from "records"
        where "records"."updated_at" < '2015-10-10'
      `, '`updatedBefore`'
    );

    const fetchAfter = TimestampMapper.updatedAfter('2015-10-10')
      .prepareFetch();

    st.queriesEqual(
      fetchAfter.toQueryBuilder(), `
        select "records".*
        from "records"
        where "records"."updated_at" > '2015-10-10'
      `, '`updatedAfter`'
    );

    const fetchBetween = TimestampMapper
      .updatedBetween('2014-10-10', '2015-10-10')
      .prepareFetch();

    st.queriesEqual(
      fetchBetween.toQueryBuilder(), `
        select "records".*
        from "records"
        where "records"."updated_at" > '2014-10-10'
        and "records"."updated_at" < '2015-10-10'
      `, '`updatedBetween`'
    );

    st.end();
  });
});
