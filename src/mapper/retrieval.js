import _ from 'lodash';
import { isEmpty } from 'lodash/lang';
import { NotFoundError, NoRowsFoundError } from '../errors';

const options = {
  isRequired: false,
  isSingle: false
};

const methods = {

  require() {
    return this.setOption('isRequired', true);
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
    return this.setOption('isSingle', true);
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
    return this.setOption('isSingle', false);
  },

  fetchOne() {
    return this.one().fetch();
  },

  fetchAll() {
    return this.all().fetch();
  },

  find(...ids) {
    return this.target(...ids).fetch();
  },

  findBy(attribute, ...ids) {
    return this.targetBy(attribute, ...ids).fetch();
  },

  fetch() {
    const queryBuilder = this.prepareFetch().toQueryBuilder();
    return queryBuilder.then(response =>
      this.handleFetchResponse({ queryBuilder, response })
    ).then(records => {
      const relationTree = this.getOption('withRelated');
      return this.loadInto(relationTree, records);
    });
  },

  prepareFetch() {
    const isSingle = this.getOption('isSingle');
    const table = this.getOption('table');

    return this.query(queryBuilder => {
      if (isSingle) {
        queryBuilder.limit(1);
      }
      queryBuilder.select(`${table}.*`);
    });
  },

  handleFetchResponse({ queryBuilder, response }) {
    const isRequired = this.getOption('isRequired');
    const isSingle   = this.getOption('isSingle');

    if (isEmpty(response)) {
      if (isRequired) {
        throw isSingle
          ? new NotFoundError(this, queryBuilder, 'fetch')
          : new NoRowsFoundError(this, queryBuilder, 'fetch');
      }
      return isSingle ? null : [];
    }

    const attributes = _(response)
      .map(this.columnsToAttributes, this)
      .map(this.createRecord, this);

    const record = this.forge(
      isSingle ? attributes.first() : attributes.value()
    );

    return record;
  }
};

export default { options, methods };
