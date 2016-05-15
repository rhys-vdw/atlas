import Promise from 'bluebird';
import {
  isArray, isEmpty, groupBy, reject, map, zipObject,
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

    const { Self, relatedList } = this;

    // Group relations by name.
    const relatedByName = groupBy(relatedList, related =>
      related.name()
    );

    // `mapRelated` expects input to be normalized. eg. it receives either an
    // array or a single record (no spread).
    const targets = normalizeRecords(...records);

    // Now fetch all related records from each relation and resolve them as a
    // keyed object to be assigned to parent records.
    return Promise.props(mapValues(relatedByName, (relatedArray, name) => {

      if (relatedArray.length > 1) console.error(
        `WARNING: Duplicate relation name "${name}" will be ignored`
      );

      const [related] = relatedArray;

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
