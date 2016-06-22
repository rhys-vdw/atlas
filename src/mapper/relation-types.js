function getAttribute(attributes, mapper) {
  if (attributes != null) {
    return attributes[mapper.getName()];
  }
}

export default {

  // one-to-one
  hasOne(Other, attributes) {
    return this.hasMany(Other, attributes).one();
  },

  // one-to-many
  hasMany(Other, attributes) {
    const selfAttribute = getAttribute(attributes, this);
    const otherAttribute = getAttribute(attributes, Other);
    return this.one(selfAttribute).to(Other.many(otherAttribute));
  },

  // many-to-one
  belongsTo(Other, attributes) {
    const selfAttribute = getAttribute(attributes, this);
    const otherAttribute = getAttribute(attributes, Other);
    return this.many(selfAttribute).to(Other.one(otherAttribute));
  },

  // many-to-many (singular assumes *no join table* - might be a thing)
  belongsToMany(Other, attributes) {
    const selfAttribute = getAttribute(attributes, this);
    const otherAttribute = getAttribute(attributes, Other);
    return this.many(selfAttribute).to(Other.many(otherAttribute));
  },

};
