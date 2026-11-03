import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listDocuments, uploadDocument, downloadDocument, deleteDocument } from "../api/studentFileApi";
import { DOCUMENT_RULES, checkFile, formatSize } from "../utils/uploadRules";

export default function StudentDocuments({ studentId }) {
  const { can } = useAuth();
  const canUpload = can("documents:manage");
  const canDelete = can("documents:delete");
  const inputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await listDocuments(studentId);
        if (!ignore) setDocuments(res.data);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [studentId, reloadKey]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMessage("");
    setActionError("");
    const problem = checkFile(file, DOCUMENT_RULES);
    if (problem) {
      setActionError(problem);
      return;
    }
    setBusyId("upload");
    try {
      await uploadDocument(studentId, file);
      setMessage(`${file.name} uploaded.`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDownload = async (doc) => {
    setActionError("");
    setBusyId(doc._id);
    try {
      const { blob, fileName } = await downloadDocument(studentId, doc._id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || doc.originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete ${doc.originalName}? This cannot be undone.`)) return;
    setMessage("");
    setActionError("");
    setBusyId(doc._id);
    try {
      await deleteDocument(studentId, doc._id);
      setMessage(`${doc.originalName} was deleted.`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="documents" aria-labelledby="documents-heading">
      <div className="page-header">
        <h2 id="documents-heading">Supporting documents</h2>
        {canUpload && (
          <>
            <input ref={inputRef} type="file" accept={DOCUMENT_RULES.accept} onChange={handleFile} hidden />
            <button
              type="button"
              className="btn btn-small"
              onClick={() => inputRef.current?.click()}
              disabled={busyId === "upload"}
            >
              {busyId === "upload" ? "Uploading..." : "Upload document"}
            </button>
          </>
        )}
      </div>
      {canUpload && <p className="field-note">{DOCUMENT_RULES.hint} These files are private.</p>}

      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}
      {actionError && (
        <p className="error-box" role="alert">
          {actionError}
        </p>
      )}

      {loading && (
        <p className="status" role="status">
          Loading documents...
        </p>
      )}
      {!loading && error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && documents.length === 0 && <p className="empty-state">No documents uploaded yet.</p>}

      {!loading && !error && documents.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Size</th>
                <th>Uploaded by</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc._id}>
                  <td>{doc.originalName}</td>
                  <td>{formatSize(doc.size)}</td>
                  <td>{doc.uploadedBy?.username ?? "Unknown"}</td>
                  <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() => handleDownload(doc)}
                        disabled={busyId === doc._id}
                      >
                        Download
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          className="btn btn-small btn-danger"
                          onClick={() => handleDelete(doc)}
                          disabled={busyId === doc._id}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
