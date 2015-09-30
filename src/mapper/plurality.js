
const options = {
  isSingle: false
}

const methods = {

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
};

export default { options, methods };
