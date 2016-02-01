import Promise from 'bluebird';
import { groupBy, reject, map } from 'lodash/collection';
import { isArray, isEmpty } from 'lodash/lang';
import { zipObject } from 'lodash/array';
import {
  keys as objectKeys, mapValues, values as objectValues
} from 'lodash/object';
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
    return Promise.props(mapValues(relatedByName, ([related, ...duplicates], name) => {
      if (!isEmpty(duplicates)) console.error(
        `WARNING: Duplicate relation name "${name}" will be ignored`
      );

      return related.toMapperOf(Self, ...records).fetch().then(records =>
        related.mapRelated(Self, targets, records)
      );
    })).then(recordsByName => {

      // If we have only one record to assign to, simply assign the hash.
      if (!isArray(targets)) {
        return Self.setRelated(targets, recordsByName);
      }

      // Otherwise assign the value at each index to its corresponding record.
      const names = objectKeys(recordsByName);
      const mapped = objectValues(recordsByName);

      return map(targets, (target, index) =>
        Self.setRelated(target, zipObject(names, map(mapped, index)))
      );
    });
  }
}
