import identity from 'lodash/utility/identity';

import BelongsTo from './belongs-to';
import BelongsToMany from './belongs-to-many';
import HasMany from './has-many';
import HasOne from './has-one';

export const initialize = (toMapper = identity) => ({

  belongsTo: (Other, options) => (Self) =>
    new BelongsTo(Self, toMapper(Other), options),

  belongsToMany: (Other, { Pivot, ...options}) => (Self) =>
    new BelongsToMany(Self, toMapper(Other), toMapper(Pivot), options),

  hasMany: (Other, options) => (Self) =>
    new HasMany(Self, toMapper(Other), options),

  hasOne: (Other, options) => (Self) =>
    new HasOne(Self, toMapper(Other), options),
});

const { belongsTo, belongsToMany, hasMany, hasOne } = initialize();
export { belongsTo, belongsToMany, hasMany, hasOne };
