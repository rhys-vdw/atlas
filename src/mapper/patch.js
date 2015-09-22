import { map } from 'lodash/collection';
import { flow } from 'lodash/function';
import { NotFoundError, NoRowsFoundError } from '../errors';

const methods = {

  /**
   * @param {Object} attributes
   *   Attributes to be set on all mathed rows.
   * @returns
   *   Number of attributes
   */
  patch(attributes) {
    const queryBuilder = this.toPatchQueryBuilder();
    return queryBuilder.then(response =>
      this._handlePatchResponse({ attributes, queryBuilder, response })
    );
  },

  /**
   * @param {Object} attributes
   *   Attributes to be set on all matched rows.
   */
  toPatchQueryBuilder(attributes) {
    const columns = this.attributesToColumns(attributes);
    return this.toQueryBuilder().update(columns, '*');
  },

  /** @private */
  _handlePatchResponse({ attributes, queryBuilder, response }) {

    const isRequired = this.getOption('isRequired');
    const isSingle = this.getOption('isSingle');

    // Handle either rows or count response.
    let rows, count;
    if (isArray(response)) {
      rows = response;
      count = response.length;
    } else {
      rows = null;
      count = response;
    }

    // Reject if chained with `.require()` and response is empty.
    if (isRequired && count === 0) {
      throw isSingle
        ? new NotFoundError(this, queryBuilder, 'patch')
        : new NoRowsFoundError(this, queryBuilder, 'patch');
    }

    // If we have a full response (as is enabled by PostgreSQL), then
    if (rows) {
      const rowToRecord = flow(this.columnsToAttributes, this.createRecord);
      return map(response, rowToRecord, this);
    }
    
    // Otherwise just return a count.
    return count;
  }

};

export default { methods };
