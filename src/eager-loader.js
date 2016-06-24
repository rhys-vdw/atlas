/* eslint no-console:0 */
import Promise from 'bluebird';
import {
  flatten, isArray, isEmpty, isUndefined, keys as objectKeys, map, mapValues,
  reduce, values as objectValues, zipObject
} from 'lodash';
import { normalizeRecords } from './arguments';

/**
 * Eager loads related records into an existing record.
 * @see Mapper#load
 */
class EagerLoader {

  /**
   * @param {Mapper} Self
   *   Mapper of target records.
   * @param {function|string[]} related
   *   One or more Related instances describing the relation tree.
   */
  constructor(Self, relations) {
    this.Self = Self;
    this.relations = flatten(relations).map(relation =>
      Self.relation(relation)
    );
  }

  /**
   * Load relations into one or more records.
   *
   * @returns {Promise<Object|Object[]>}
   *   One or more records with relations.
   */
  into(...records) {

    const { Self, relations } = this;

    // `mapRelated` expects input to be normalized. eg. it receives either an
    // array or a single record (no spread).
    const targets = normalizeRecords(...records);

    // If there are no relations or target records, short circuit.
    if (isEmpty(targets) || relations.length === 0) {
      return targets;
    }

    // Group relations by name.
    // TODO: This is silly. `with` should throw if a duplicate relation is
    // registered. `relations` should be a hash of `createRelation` functions.
    const relationByName = reduce(relations, (result, relation) => {
      const relationName = relation.getName();
      if (!isUndefined(result[relationName])) console.warn(
        `WARNING: Duplicate relation name "${relationName}" overrides ` +
        `existing relation.`
      );
      result[relationName] = relation;
      return result;
    }, {});

    // Now fetch all related records from each relation and resolve them as a
    // keyed object to be assigned to parent records.
    return Promise.props(mapValues(relationByName, relation =>
      relation.of(...records).fetch().then(related =>
        relation.mapRelated(targets, related)
      )
    )).then(recordsByName => {

      // If we have only one record to assign to, simply assign the hash.
      if (!isArray(targets)) {
        return Self.setRelated(targets, recordsByName);
      }

      // Otherwise assign the value at each index to its corresponding record.
      const relationNames = objectKeys(recordsByName);
      const recordsByIndex = objectValues(recordsByName);

      // NOTE: `setRelated` returns a copy, so it's important that all relations
      // are assigned simulataneously (so that only one copy is made).
      return map(targets, (target, index) => {
        const records = map(recordsByIndex, index);
        return Self.setRelated(target, zipObject(relationNames, records));
      });
    });
  }
}

export default EagerLoader;
