export default function InputField({
  label,
  name,
  value,
  onChange,
  error,
  as = "input",
  type = "text",
  options = [],
  placeholder = "",
  ...rest
}) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;

  const common = {
    id,
    name,
    value,
    onChange,
    "aria-invalid": error ? "true" : "false",
    "aria-describedby": error ? errorId : undefined,
    ...rest,
  };

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>

      {as === "select" ? (
        <select {...common}>
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : as === "textarea" ? (
        <textarea rows="3" placeholder={placeholder} {...common} />
      ) : (
        <input type={type} placeholder={placeholder} {...common} />
      )}

      {error && (
        <span id={errorId} className="error-text" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}