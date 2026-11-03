const PERMISSIONS = {
  "students:read": ["admin", "staff", "viewer"],
  "students:create": ["admin", "staff"],
  "students:update": ["admin", "staff"],
  "students:delete": ["admin"],
  "users:manage": ["admin"],
};

const HIDDEN_STUDENT_FIELDS = {
  viewer: ["mobile", "address"],
};

const LOCKED_STUDENT_FIELDS = {
  staff: ["email"],
};

export function can(user, permission) {
  return Boolean(user && PERMISSIONS[permission]?.includes(user.role));
}

export function canSeeField(user, field) {
  return Boolean(user) && !(HIDDEN_STUDENT_FIELDS[user.role] || []).includes(field);
}

export function canEditField(user, field) {
  return can(user, "students:update") && !(LOCKED_STUDENT_FIELDS[user.role] || []).includes(field);
}