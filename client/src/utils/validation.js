const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value) {
  const v = value.trim();
  if (!v) return "Email is required";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address";
  return "";
}

export function validateUsername(value) {
  const v = value.trim();
  if (!v) return "Username is required";
  if (v.length < 3 || v.length > 30) return "Username must be 3 to 30 characters";
  if (!/^[A-Za-z0-9_]+$/.test(v)) return "Use only letters, numbers and underscores";
  return "";
}

export function validatePassword(value) {
  if (!value) return "Password is required";
  if (value.length < 8 || value.length > 72) return "Password must be 8 to 72 characters";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "Password must contain at least one letter and one number";
  }
  return "";
}

export function validateConfirm(password, confirm) {
  if (!confirm) return "Please confirm the password";
  if (password !== confirm) return "Passwords do not match";
  return "";
}

export function serverFieldErrors(err) {
  const out = {};
  for (const e of err.errors || []) {
    if (e.field) out[e.field] = e.message;
  }
  if (err.status === 409) {
    if (/email/i.test(err.message)) out.email = err.message;
    else if (/username/i.test(err.message)) out.username = err.message;
  }
  return out;
}

export const hasErrors = (errors) => Object.values(errors).some(Boolean);