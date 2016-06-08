
/*
user.group_id = groups.id, groups.owner_id = user.id

// one-to-one (through)
hasOne(Users, { otherAttribute: 'owner_id' }).through('groups') // implicit relation join here
hasOne(Users, { otherAttribute: 'owner_id' })
  .through(Groups, { otherAttribute: , joinAttribute })

Users.one('group_id').to(Users.join(Groups, 'id', 'owner_id')).as('group_owner')

Self.one(selfAttribute).to(Other.join(Join, { joinAttribute, otherJoinAttribute }))


function hasOne(Other, { selfAttribute, otherAttribute } = {}) {
  return Self => Self.one(selfAttribute).to(Other.one(otherAttribute));
}
*/




// one-to-one
function hasOne(Other, { selfAttribute, otherAttribute } = {}) {
  return this.one(selfAttribute).to(Other.one(otherAttribute));
}

// one-to-many
function hasMany(Other, { selfAttribute, otherAttribute } = {}) {
  return this.one(selfAttribute).to(Other.many(otherAttribute));
}

// many-to-one
function belongsTo(Other, { selfAttribute, otherAttribute } = {}) {
  return this.many(selfAttribute).to(Other.one(otherAttribute));
}

// many-to-many (singular assumes *no join table* - might be a thing)
function hasAndBelongsToMany(Other, { selfAttribute, otherAttribute } = {}) {
  return this.many(selfAttribute).to(Other.many(otherAttribute));
}

export { hasOne, hasMany, belongsTo, hasAndBelongsToMany };
