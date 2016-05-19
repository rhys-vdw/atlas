import test from 'tape';
import Mapper from '../../../lib/mapper';
import CamelCase from '../../../lib/plugins/CamelCase';

test('Mapper.orderBy()', t => {

  const Messages = Mapper.table('messages');

  t.queriesEqual(
    Messages.orderBy('created_at').prepareFetch().toQueryBuilder(), `
      select "messages".*
      from "messages"
      order by "messages"."created_at" asc
    `,
    'defaults to ascending'
  );

  t.queriesEqual(
    Messages.orderBy('created_at', 'desc').prepareFetch().toQueryBuilder(), `
      select "messages".*
      from "messages"
      order by "messages"."created_at" desc
    `,
    'allows ordering in descending order'
  );

  const Camelized = Mapper.extend(CamelCase()).table('items')
    .orderBy('someColumn', 'asc')
    .orderBy('anotherColumn', 'desc');

  t.queriesEqual(
    Camelized.prepareFetch().toQueryBuilder(), `
      select "items".*
      from "items"
      order by
        "items"."some_column" asc,
        "items"."another_column" desc
    `,
    'respects `attributeToColumn`'
  );

  t.end();
});
