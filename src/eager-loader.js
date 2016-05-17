import Promise from 'bluebird';
import {
  isArray, isEmpty, reduce, reject, map, zipObject,
  keys as objectKeys, mapValues, values as objectValues
} from 'lodash';
import { normalizeRecords } from './arguments';
import { isRelated } from './related';
import { inspect } from 'util';

export default class EagerLoader {
  constructor(Self, related) {
    const invalid = reject(related, isRelated);
    if (!isEmpty(invalid)) throw new TypeError(
      `Expected instance(s) of Related, got ${inspect(related)}`
    );

    this.Self = Self;
    this.relatedList = related;
  }

  into(...records) {

    // `mapRelated` expects input to be normalized. eg. it receives either an
    // array or a single record (no spread).
    const targets = normalizeRecords(...records);

    if (isEmpty(targets)) {
      return targets;
    }

    const { Self, relatedList } = this;

    // Group relations by name.
    const relatedByName = reduce(relatedList, (result, related) => {
      const relationName = related.name();
      if (result.hasOwnProperty(relationName)) {
        console.error(
          `WARNING: Duplicate relation name "${relationName}" will be ignored`
        );
      } else {
        result[relationName] = related;
      }
      return result;
    }, {});

    // Now fetch all related records from each relation and resolve them as a
    // keyed object to be assigned to parent records.
    return Promise.props(mapValues(relatedByName, related => {
      return related.toMapperOf(Self, ...records).fetch().then(records =>
        related.mapRelated(Self, targets, records)
      );
    })).then(recordsByName => {

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
