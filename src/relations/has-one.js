import { isArray } from 'lodash/lang';
import { indexBy } from 'lodash/collection';
import { first } from 'lodash/array';
import * as DefaultColumn from './default-column';
import { isComposite, keysCompatible } from '../arguments';

export default class HasOne {
  constructor(Self, Other, { selfKey, otherRef } = {}) {
    if (selfKey == null) {
      selfKey = Self.getOption('idAttribute');
    }

    if (otherRef == null) {
      otherRef = DefaultColumn.fromMapperAttribute(Self, selfKey);
    }

    if (!keysCompatible(selfKey, otherRef)) throw new TypeError(
      `Mismatched key types. selfKey=${selfKey} otherRef=${otherRef}`
    );

    this.Self = Self;
    this.Other = Other;
    this.selfKey = selfKey;
    this.otherRef = otherRef;
  }

  toMapper(targetIds) {
    const { Self, Other, selfKey, otherRef } = this;

    const id = Self.identifyBy(selfKey, targetIds);
    const isSingle = !isArray(id) ||
      isComposite(selfKey) && !isComposite(first(id));

    return Other.withMutations(mapper => {
      mapper.targetBy(otherRef, id);
      if (isSingle) {
        mapper.defaultAttribute(otherRef, id);
      }
    });
  }

  load(atlas, relationName, records) {
    const Mapper = atlas(this.toMapper(records));

    if (!isArray(records)) {
      return Mapper.fetch().then(related =>
        Mapper.setRelated(records, relationName, related)
      );
    }

    return Mapper.fetch().then(related =>
      this.assign(atlas, relationName, records, related)
    );
  }

  assignRelated(records, relationName, related) {
    const { Self, Other, selfKey, otherRef } = this;

    const relatedById = indexBy(related, record =>
      Other.identifyBy(otherRef, record)
    );

    return records.map(record => {
      const id = Self.identifyBy(selfKey, record);
      const related = relatedById[id] || null;
      return Self.setRelated(record, relationName, related);
    });
  }

}
