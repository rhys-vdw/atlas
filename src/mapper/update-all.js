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
  updateAll(attributes) {
    if (this.isNoop()) {
      return this.getOption('isSingle') ? null : [];
    }
    const queryBuilder = this.prepareUpdateAll(attributes).toQueryBuilder();
    return queryBuilder.then(response =>
      this.handleUpdateAllResponse({ attributes, queryBuilder, response })
    );
  },

  /**
   * @param {Object} attributes
   *   Attributes to be set on all matched rows.
   */
  prepareUpdateAll(attributes) {
    const columns = this.attributesToColumns(attributes);
    return this.query('update', columns, '*');
  },

  /**
   * @param {Object} info
   * @param {Object} info.attributes
   *   Attributes passed to `updateAll()`.
   * @param {Object} info.queryBuilder
   *   The `QueryBuilder` instance that generated the `updateAll` query.
   * @param {Object[]|Number} info.response
   *   Either a count of updated rows, or an array of updated rows.
   * @returns {Object[]|Number}
   *   Either a count of updated rows, or an array of updated rows.
   * @throws NotFoundError
   * @throws NoRowsFoundError
   * @private
   */
  handleUpdateAllResponse({ attributes,  queryBuilder, response }) {

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
      throw new NoRowsFoundError(this, queryBuilder, 'updateAll');
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