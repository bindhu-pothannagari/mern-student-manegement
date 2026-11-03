import { request } from "./client.js";

function fileForm(file) {
  const form = new FormData();
  form.append("file", file);
  return form;
}

export const uploadPhoto = (id, file) =>
  request(`/students/${id}/photo`, { method: "PUT", body: fileForm(file) });
export const getPhotoBlob = (id) => request(`/students/${id}/photo`, { responseType: "blob" });
export const removePhoto = (id) => request(`/students/${id}/photo`, { method: "DELETE" });

export const listDocuments = (id) => request(`/students/${id}/documents`);
export const uploadDocument = (id, file) =>
  request(`/students/${id}/documents`, { method: "POST", body: fileForm(file) });
export const downloadDocument = (id, docId) =>
  request(`/students/${id}/documents/${docId}/download`, { responseType: "blob" });
export const deleteDocument = (id, docId) =>
  request(`/students/${id}/documents/${docId}`, { method: "DELETE" });
