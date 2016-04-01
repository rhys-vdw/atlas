const methods = {

  prepareCount(attribute = null) {
    const column = attribute == null
      ? '*' : this.attributeToTableColumn(attribute);

    return this.query(qb => qb.count(column));
  },

  count(attribute = null) {
    return this.prepareCount(attribute).toQueryBuilder();
  }
};

export default { methods };
