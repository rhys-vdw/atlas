export default {

  prepareCount(attribute = null) {
    const column = attribute == null
      ? '*' : this.attributeToTableColumn(attribute);

    return this.query(qb => qb.count(column));
  },

  /**
   * @method Mapper#count
   * @description
   *
   * Count records.
   *
   * @example
   *
   * const Articles = Mapper.table('articles');
   *
   * Articles.count().then(count => {
   *   console.log('Total articles:', count);
   * });
   *
   * Articles.where('topic', 'JavaScript').count().then(count => {
   *   console.log('Total JavaScript articles:', count);
   * });
   *
   * @returns {Promise<Number>}
   *   The number of matching records.
   */
  count(attribute = null) {
    return this.prepareCount(attribute).toQueryBuilder();
  }
};
