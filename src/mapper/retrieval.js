import _ from 'lodash';
import { assertFound } from '../assertions';
import { Promise } from 'bluebird';
import { NotFoundError, NoRowsFoundError } from '../errors';

const options = {
  isRequired: false
}

const methods = {

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

  _handleFetchResponse(response) {
    const isRequired = this.getOption('isRequired');
    const isSingle   = this.getOption('isSingle');

    if (isRequired && isEmpty(response)) {
      throw isSingle
        ? new NotFoundError(this, queryBuilder, 'fetch')
        : new NoRowsFoundError(this, queryBuilder, 'fetch');
    } 

    const attributes = _(response)
      .map(this.columnsToAttributes, this)
      .map(this.createRecord, this);

    return this.forge(isSingle ? attributes.head() : attributes.value());
  }
};

export default { options, methods };
