import { useEffect, useRef, useState } from "react";
import { getPhotoBlob, uploadPhoto, removePhoto } from "../api/studentFileApi";
import { PHOTO_RULES, checkFile } from "../utils/uploadRules";

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default function StudentPhoto({ studentId, name, hasPhoto, canEdit }) {
  const inputRef = useRef(null);
  const [version, setVersion] = useState(hasPhoto ? 1 : 0);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!version) {
      return undefined;
    }
    let ignore = false;
    let objectUrl = "";
    getPhotoBlob(studentId)
      .then(({ blob }) => {
        if (ignore) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((err) => {
        if (!ignore) setError(err.status === 404 ? "The photo could not be found." : err.message);
      });
    return () => {
      ignore = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [studentId, version]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setMessage("");
    const problem = checkFile(file, PHOTO_RULES);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    try {
      await uploadPhoto(studentId, file);
      setVersion((v) => v + 1);
      setMessage("Photo updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm("Remove this photo?")) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await removePhoto(studentId);
      setVersion(0);
      setMessage("Photo removed.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="photo-box">
      {version && url ? (
        <img src={url} alt={`Photo of ${name}`} className="student-photo" />
      ) : (
        <div className="photo-placeholder" aria-hidden="true">
          {initials(name)}
        </div>
      )}

      {canEdit && (
        <div className="photo-actions">
          <input ref={inputRef} type="file" accept={PHOTO_RULES.accept} onChange={handleFile} hidden />
          <button
            type="button"
            className="btn btn-small"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? "Working..." : version ? "Replace photo" : "Upload photo"}
          </button>
          {version > 0 && (
            <button type="button" className="btn btn-small btn-secondary" onClick={handleRemove} disabled={busy}>
              Remove
            </button>
          )}
          <span className="field-note">{PHOTO_RULES.hint}</span>
        </div>
      )}

      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
