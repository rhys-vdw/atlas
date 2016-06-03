import BelongsTo from './belongs-to';
import BelongsToMany from './belongs-to-many';
import HasMany from './has-many';
import HasOne from './has-one';

export { BelongsTo, BelongsToMany, HasMany, HasOne };

export default {

  belongsTo(Other, options) {
    const { atlas } = this.state;
    return new BelongsTo(this, atlas(Other), options);
  },

  belongsToMany(Other, options) {
    const { atlas } = this.state;
    const { Pivot, ...rest } = options;
    return new BelongsToMany(this, atlas(Other), atlas(Pivot), rest);
  },

  hasMany(Other, options) {
    const { atlas } = this.state;
    return new HasMany(this, atlas(Other), options);
  },

  hasOne(Other, options) {
    const { atlas } = this.state;
    return new HasOne(this, atlas(Other), options);
  },

};
