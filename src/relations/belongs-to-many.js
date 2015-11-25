import { assign } from 'lodash/object';
import { isArray } from 'lodash/lang';
import { groupBy } from 'lodash/collection';
import { first } from 'lodash/array';

import Mapper from '../mapper';
import { mapperAttributeRef } from '../naming/default-column';
import * as DefaultTable from '../naming/table';
import { isComposite, assertKeysCompatible } from '../arguments';
import { hasMany } from './index';
import { PIVOT_PREFIX } from '../constants';

export default class BelongsToMany {
  constructor(Self, Other, Pivot = null, {
    selfKey, otherKey,
    pivotSelfRef, pivotOtherRef, pivotTable, pivotName = 'pivot'
  } = {}) {

    // Default self keys.

    if (selfKey == null) {
      selfKey = Self.getOption('idAttribute');
    }

    if (pivotSelfRef == null) pivotSelfRef = Self.attributeToColumn(
      mapperAttributeRef(Self, selfKey)
    );

    assertKeysCompatible({ selfKey, pivotSelfRef });

    // Default other keys.

    if (otherKey == null) {
      otherKey = Other.getOption('idAttribute');
    }

    if (pivotOtherRef == null) pivotOtherRef = Other.attributeToColumn(
      mapperAttributeRef(Other, otherKey)
    );

    assertKeysCompatible({ otherKey, pivotOtherRef });

    // Create Pivot mapper if none provided.

    if (Pivot == null) {
      Pivot = Mapper.withMutations({
        table: pivotTable || DefaultTable.pivot(Other, Self),
        idAttribute: [pivotSelfRef, pivotOtherRef]
      });
    }

    // Create the relation between Other and Pivot
    const pivots = hasMany(Pivot, {
      selfKey: otherKey,
      otherRef: pivotOtherRef,
      pivotTable
    });

    // Constrain pivot relation

    const JoinedOther = Other.withMutations({
      relations: { [pivotName]: pivots },
      joinRelation: pivotName,
      pivotAttributes: [pivotSelfRef, pivotOtherRef]
    });

    const selfAttribute = selfKey;
    const pivotSelfColumn = Pivot.attributeToColumn(pivotSelfRef);
    const pivotSelfTableColumn = Pivot.columnToTableColumn(pivotSelfColumn);
    const otherAttribute = Other.columnToAttribute(
      `${PIVOT_PREFIX}${pivotSelfColumn}`
    );

    assign(this, {
      Self, Other: JoinedOther,
      selfAttribute, otherAttribute, pivotSelfTableColumn,
    });
  }

  toMapper(...targetIds) {
    const {
      Self, Other, selfAttribute, otherAttribute, pivotSelfTableColumn
    } = this;

    const id = Self.identifyBy(selfAttribute, ...targetIds);
    const isSingle = !isArray(id) ||
      isComposite(selfAttribute) && !isComposite(first(id));

    return Other.withMutations(other => {
      if (isSingle) {
        other.query('where', pivotSelfTableColumn, id);
        other.defaultAttribute(otherAttribute, id);
      } else {
        other.query('whereIn', pivotSelfTableColumn, id);
      }
    });
  }

  assignRelated(records, relationName, related) {
    const { Self, Other, selfAttribute, otherAttribute } = this;

    if (!isArray(records)) {
      return Self.setRelated(records, relationName, related);
    }

    const relatedById = groupBy(related, record =>
      Other.identifyBy(otherAttribute, record)
    );

    return records.map(record => {
      const id = Self.identifyBy(selfAttribute, record);
      const related = relatedById[id] || [];
      return Self.setRelated(record, relationName, related);
    });
  }

}
