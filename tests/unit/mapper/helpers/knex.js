import Mapper from '../../../../lib/mapper';
import test from 'tape';
import {
  isQueryBuilderEmpty, isQueryBuilderJoined, isQueryBuilderSpecifyingColumns
} from '../../../../lib/mapper/helpers/knex';

test('Knex helpers', t => {

  t.test('isQueryBuilderEmpty', st => {
    const EmptyMapper = Mapper.table('table');
    const WhereMapper = EmptyMapper.where('thing', 5);

    st.true(isQueryBuilderEmpty(EmptyMapper));
    st.false(isQueryBuilderEmpty(WhereMapper));
    st.true(isQueryBuilderEmpty(EmptyMapper.toQueryBuilder()));
    st.false(isQueryBuilderEmpty(WhereMapper.toQueryBuilder()));
    st.end();
  });


  t.test('isQueryBuilderJoined', st => {
    const UnjoinedMapper = Mapper.table('things');
    const JoinedMapper = Mapper.table('selves').query(query => {
      query.join('others', 'others.id', 'selves.other_id');
    });

    st.true(isQueryBuilderJoined(JoinedMapper));
    st.false(isQueryBuilderJoined(UnjoinedMapper));
    st.true(isQueryBuilderJoined(JoinedMapper.toQueryBuilder()));
    st.false(isQueryBuilderJoined(UnjoinedMapper.toQueryBuilder()));
    st.end();
  });

  t.test('isQueryBuilderSpecifyingColumns', st => {
    const AllMapper = Mapper.table('things');
    const ColumnsMapper = Mapper.table('selves').query(query => {
      query.select('some_column', 'another');
    });

    st.true(isQueryBuilderSpecifyingColumns(ColumnsMapper));
    st.false(isQueryBuilderSpecifyingColumns(AllMapper));
    st.true(isQueryBuilderSpecifyingColumns(ColumnsMapper.toQueryBuilder()));
    st.false(isQueryBuilderSpecifyingColumns(AllMapper.toQueryBuilder()));
    st.end();
  });

});
