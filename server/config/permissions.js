export const PERMISSIONS = {
  "students:read": ["admin", "staff", "viewer"],
  "students:create": ["admin", "staff"],
  "students:update": ["admin", "staff"],
  "students:delete": ["admin"],
  "users:manage": ["admin"],
};

export const STUDENT_FIELDS = ["fullName", "email", "mobile", "gender", "course", "address"];

export const EDITABLE_STUDENT_FIELDS = {
  admin: STUDENT_FIELDS,
  staff: ["fullName", "mobile", "gender", "course", "address"],
  viewer: [],
};

export const HIDDEN_STUDENT_FIELDS = {
  admin: [],
  staff: [],
  viewer: ["mobile", "address"],
};

export function hasPermission(role, permission) {
  return PERMISSIONS[permission]?.includes(role) ?? false;
}

export function studentProjection(role) {
  const hidden = HIDDEN_STUDENT_FIELDS[role] ?? STUDENT_FIELDS;
  return hidden.map((field) => `-${field}`).join(" ");
}