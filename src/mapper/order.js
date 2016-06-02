export default {

  /**
   * @method Mapper#orderBy
   * @summary
   *
   * Order the records returned by a query.
   *
   * @example
   *
   * Messages.orderBy('received_at', 'desc').first().then(message => {
   *   console.log(`${message.sender} says "${message.text}"`);
   * });
   *
   * @param {string|string[]} attribute
   *   The attribute(s) by which to order the response.
   * @param {string} [direction=asc]
   *   The direction by which to order the records. Either `'asc'` for
   *   ascending, or `'desc'` for descending.
   * @returns {Mapper}
   *   Mapper with query ordered by `attribute`.
   */
  orderBy(attribute, direction = 'asc') {
    const column = Array.isArray(attribute)
      ? attribute.map(this.attributeToTableColumn, this)
      : this.attributeToTableColumn(attribute);

    return this.query(queryBuilder => {
      queryBuilder.orderBy(column, direction);
    });
  }

};
