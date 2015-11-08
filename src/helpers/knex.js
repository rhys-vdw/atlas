/**
 * Workaround for Knex not having an `unlimit` method.
 */
export function unlimitQuery(query) {
  const copy = query.clone();
  delete copy._single.limit;
  return copy;
}
