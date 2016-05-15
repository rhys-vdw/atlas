import Promise from 'bluebird';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import flatten from 'lodash/flatten';
import { NotFoundError, NoRowsFoundError } from '../errors';
import { PIVOT_PREFIX } from '../constants';
import { isQueryBuilderSpecifyingColumns } from './helpers/knex';

export default {

  initialize() {
    this.setState({
      isRequired: false,
      isSingle: false
    });
  },

  attributes(...attributes) {
    const columns = flatten(attributes).map(attribute =>
      this.attributeToTableColumn(attribute)
    );
    return this.query('select', columns);
  },

  require() {
    return this.setState({ isRequired: true });
  },

  /**
   * @method one
   * @belongsTo Mapper
   * @summary
   *
   * Query a single row.
   *
   * @description
   *
   * Limit query to a single row. Causes subsequent calls to {@link
   * Mapper#fetch fetch} to resolve to a single record (rather
   * than an array). Opposite of {@link Mapper#all all}.
   *
   * @returns {Mapper}
   *   Mapper targeting a single row.
   */
  one() {
    return this.setState({ isSingle: true });
  },

  /**
   * @method all
   * @belongsTo Mapper
   * @summary
   *
   * Query multiple rows. Default behaviour.
   *
   * @description
   *
   * Unlimits query. Opposite of {@link Mapper#one one}.
   *
   * @returns {Mapper}
   *   Mapper targeting a single row.
   */
  all() {
    return this.setState({ isSingle: false });
  },

  first() {
    return this.one().fetch();
  },

  fetchAll() {
    return this.all().fetch();
  },

  find(...ids) {
    return Promise.try(() =>
      this.target(...ids).fetch()
    );
  },

  findBy(attribute, ...ids) {
    return Promise.try(() =>
      this.targetBy(attribute, ...ids).fetch()
    );
  },

  fetch() {
    if (this.isNoop()) {
      return Promise.resolve(this.state.isSingle ? null : []);
    }

    const mapper = this.prepareFetch();
    const queryBuilder = mapper.toQueryBuilder();
    return queryBuilder.then(response =>
      mapper.handleFetchResponse({ queryBuilder, response })
    ).then(records => {
      const { related } = this.state;
      return related == null ? records : this.load(related).into(records);
    });
  },

  prepareFetch() {
    const { isSingle, omitPivot } = this.state;

    return this.query(queryBuilder => {

      if (isSingle) {
        queryBuilder.limit(1);
      }

      // Nothing more to do if columns are already specified.
      if (!isQueryBuilderSpecifyingColumns(queryBuilder)) {

        // Always omit pivot if client has specified columns.
        if (!omitPivot) {
          const { pivotAttributes } = this.state;

          if (!isEmpty(pivotAttributes)) {
            const { pivotRelationName, pivotAlias } = this.state;
            const Pivot = this.getRelation(pivotRelationName).Other;

            const pivotColumns = map(pivotAttributes, attribute => {
              const column = Pivot.attributeToColumn(attribute);
              return `${pivotAlias}.${column} as ${PIVOT_PREFIX}${column}`;
            });

            queryBuilder.select(pivotColumns);
          }
        }

        queryBuilder.select(this.columnToTableColumn('*'));
      }
    });
  },

  handleFetchResponse({ queryBuilder, response }) {
    const { isRequired, isSingle } = this.state;

    if (isEmpty(response)) {
      if (isRequired) {
        throw isSingle
          ? new NotFoundError(this, queryBuilder, 'fetch')
          : new NoRowsFoundError(this, queryBuilder, 'fetch');
      }
      return isSingle ? null : [];
    }

    const records = response.map(row => this.columnsToRecord(row));
    return isSingle ? records[0] : records;
  }
};
