export const PHOTO_RULES = {
  label: "Photo",
  types: ["image/jpeg", "image/png", "image/webp"],
  extensions: ["jpg", "jpeg", "png", "webp"],
  maxBytes: 2 * 1024 * 1024,
  accept: ".jpg,.jpeg,.png,.webp",
  hint: "JPG, PNG or WEBP, up to 2 MB.",
};

export const DOCUMENT_RULES = {
  label: "Document",
  types: ["application/pdf", "image/jpeg", "image/png"],
  extensions: ["pdf", "jpg", "jpeg", "png"],
  maxBytes: 5 * 1024 * 1024,
  accept: ".pdf,.jpg,.jpeg,.png",
  hint: "PDF, JPG or PNG, up to 5 MB.",
};

export function checkFile(file, rules) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (!rules.extensions.includes(ext) || (file.type && !rules.types.includes(file.type))) {
    return `${rules.label} must be: ${rules.hint}`;
  }
  if (file.size === 0) return "The file is empty.";
  if (file.size > rules.maxBytes) return `${rules.label} is too large. ${rules.hint}`;
  return "";
}

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
