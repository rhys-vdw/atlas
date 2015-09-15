import _ from 'lodash';
import { assertFound } from './assertions';
import { Promise } from 'bluebird';

const defaultOptions = {
  isSingle: false,
  isRequired: false
};

const methods = {

  all() {
    return this.setOption('isSingle', false);
  },

  one() {
    return this.setOption('isSingle', true);
  },

  require() {
    return this.setOption('isRequired', true);
  },

  fetchOne() {
    return this.one().fetch();
  },

  fetchAll() {
    return this.all().fetch();
  },

  fetch() {
    return this.toFetchQueryBuilder()
      .bind(this)
      .then(this._handleFetchResponse);
  },

  toFetchQueryBuilder() {
    const queryBuilder = this.toQueryBuilder();
    const isSingle = this.getOption('isSingle');
    const table = this.getOption('table');

    if (isSingle) {
      queryBuilder.limit(1);
    }

    return queryBuilder.select(`${table}.*`);
  },

  _handleFetchResponse({ rows }) {
    const isRequired = this.getOption('isRequired');
    const isSingle   = this.getOption('isSingle');

    if (isRequired) {
      assertFound(this, rows);
    } 

    const attributes = _(rows)
      .map(this.columnsToAttributes, this)
      .map(this.createRecord, this);

    return this.forge(isSingle ? attributes.head() : attributes.value());
  }
};

export default { defaultOptions, methods };
