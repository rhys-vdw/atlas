import { isArray } from 'lodash/lang';
import { map } from 'lodash/collection';
import { NoRowsFoundError } from '../errors';

const methods = {

  /**
   * @param {Object} attributes
   *   Attributes to be set on all mathed rows.
   * @returns
   *   Number of attributes
   */
  updateColumns(attributes) {
    if (this.isNoop()) {
      return this.getOption('isSingle') ? null : [];
    }
    const queryBuilder = this.prepareUpdateColumns(attributes).toQueryBuilder();
    return queryBuilder.then(response =>
      this.handleUpdateColumnsResponse({ attributes, queryBuilder, response })
    );
  },

  /**
   * @param {Object} attributes
   *   Attributes to be set on all matched rows.
   */
  prepareUpdateColumns(attributes) {
    const columns = this.attributesToColumns(attributes);
    return this.query('update', columns, '*');
  },

  /**
   * @param {Object} info
   * @param {Object} info.attributes
   *   Attributes passed to `updateColumns()`.
   * @param {Object} info.queryBuilder
   *   The `QueryBuilder` instance that generated the `updateColumns` query.
   * @param {Object[]|Number} info.response
   *   Either a count of updated rows, or an array of updated rows.
   * @returns {Object[]|Number}
   *   Either a count of updated rows, or an array of updated rows.
   * @throws NotFoundError
   * @throws NoRowsFoundError
   * @private
   */
  handleUpdateColumnsResponse({ attributes,  queryBuilder, response }) {

    const isRequired = this.getOption('isRequired');

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
      throw new NoRowsFoundError(this, queryBuilder, 'updateColumns');
    }

    // If we have a full response (as is enabled by PostgreSQL), then
    if (rows) {
      return map(response, this.columnsToRecord, this);
    }

    // Otherwise just return a count.
    return count;
  }

};

export default { methods };
