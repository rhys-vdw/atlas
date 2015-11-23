import test from 'tape';
import Mapper from '../../../lib/mapper';
import HasMany from '../../../lib/relations/has-many';

test('== Mapper - joins ==', t => {

  t.test('Mapper#pivotAttributes()', t => {
    const WithPivot = Mapper
      .pivotAttributes(['a', 'b'])
      .pivotAttributes('c');

    t.deepEqual(
      WithPivot.getOption('pivotAttributes'),
      ['a', 'b', 'c'],
      `is additive`
    );

    const ToDedupe = Mapper
      .pivotAttributes(['a', 'a'])
      .pivotAttributes(['a']);

    t.deepEqual(
      ToDedupe.getOption('pivotAttributes'),
      ['a'],
      `deduplicates`
    );

    t.end();
  });

  t.test('Mapper#omitPivot()', t => {
    const Omitted = Mapper.omitPivot();

    t.equal(Mapper.getOption('omitPivot'), false, 'defaults to false');
    t.equal(Omitted.getOption('omitPivot'), true, 'can be set to true');

    t.end();
  });

  t.test('Mapper#joinRelated - simple join', t => {

    const Other = Mapper.table('others').idAttribute('o_id');
    const Self = Mapper.table('selves').idAttribute('s_id');

    const Joined = Self.relations({
      others: (self) => new HasMany(self, Other)
    }).joinRelated('others');

    t.queriesEqual(
      Joined.prepareFetch().toQueryBuilder(), `
        select "selves".* from "selves"
        inner join "others" on "selves"."s_id" = "others"."self_s_id"
      `, 'performs simple join when target has no statements'
    );

    const WithPivot = Joined.pivotAttributes('a', 'b', 'c');

    t.queriesEqual(
      WithPivot.prepareFetch().toQueryBuilder(), `
        select
          "others"."a" as "_pivot_a",
          "others"."b" as "_pivot_b",
          "others"."c" as "_pivot_c",
          "selves".*
        from
          "selves"
        inner join
          "others" on "selves"."s_id" = "others"."self_s_id"
      `, 'selects pivot attributes'
    );

    t.queriesEqual(
      WithPivot.omitPivot().prepareFetch().toQueryBuilder(), `
        select "selves".* from "selves"
        inner join "others" on "selves"."s_id" = "others"."self_s_id"
      `, 'pivot attributes can be omitted with `.omitPivot()`'
    );

    t.end();
  });

  t.test('Mapper#joinRelated - complex join', t => {

    const Other = Mapper.table('others').idAttribute('o_id')
      .where('thing', '>', 5);

    const Self = Mapper.table('selves').idAttribute('s_id');

    const Joined = Self.relations({
      others: (self) => new HasMany(self, Other)
    }).joinRelated('others');

    t.queriesEqual(
      Joined.prepareFetch().toQueryBuilder(), `
        select "selves".* from "selves"
        inner join (
          select "others".* from "others"
          where "others"."thing" > 5
        ) as "pivot" on "selves"."s_id" = "pivot"."self_s_id"
      `, 'performs simple join when target has no statements'
    );

    const WithPivot = Joined.pivotAttributes('a', 'b', 'c');

    t.queriesEqual(
      WithPivot.prepareFetch().toQueryBuilder(), `
        select
          "pivot"."a" as "_pivot_a",
          "pivot"."b" as "_pivot_b",
          "pivot"."c" as "_pivot_c",
          "selves".*
        from
          "selves"
        inner join (
          select "others".* from "others"
          where "others"."thing" > 5
        ) as "pivot" on "selves"."s_id" = "pivot"."self_s_id"
      `, 'selects pivot attributes'
    );

    t.end();
  });
});
