import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import api from "../api/axios";
import Brand from "../components/Brand";
import generateCertificatePDF from "../utils/generateCertificatePDF";

const emptyForm = {
  certificateId: "",
  recipientName: "",
  course: "",
  issuer: "",
  issueDate: "",
  status: "Valid",
  userId: "",
};

function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadCertificates = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/certificates");
      const data = response.data;
      setCertificates(
        Array.isArray(data) ? data : data.certificates || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load certificates."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const response = await api.get("/auth/users");
      setUsers(response.data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load registered users."
      );
    }
  }, []);

  useEffect(() => {
    loadCertificates();
    loadUsers();
  }, [loadCertificates, loadUsers]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "userId") {
      const selectedUser = users.find((user) => user._id === value);

      setForm((previous) => ({
        ...previous,
        userId: value,
        recipientName: selectedUser?.name || "",
      }));
    }
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const selectedUser = users.find(
        (user) => user._id === form.userId
      );

      if (!selectedUser) {
        setError("Please select a registered user.");
        return;
      }

      const payload = {
        ...form,
        recipientName: selectedUser.name,
      };

      if (editingId) {
        await api.put(`/certificates/${editingId}`, payload);
        setMessage("Certificate updated successfully.");
      } else {
        await api.post("/certificates", payload);
        setMessage("Certificate created and assigned successfully.");
      }

      resetForm();
      await loadCertificates();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save certificate."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (certificate) => {
    setEditingId(certificate._id);

    setForm({
      certificateId: certificate.certificateId || "",
      recipientName: certificate.recipientName || "",
      course: certificate.course || "",
      issuer: certificate.issuer || "",
      issueDate: certificate.issueDate
        ? String(certificate.issueDate).slice(0, 10)
        : "",
      status: certificate.status || "Valid",
      userId: certificate.userId
        ? String(certificate.userId._id || certificate.userId)
        : "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStatusChange = async (certificate, status) => {
    setError("");
    setMessage("");

    try {
      await api.put(`/certificates/${certificate._id}`, {
        certificateId: certificate.certificateId,
        recipientName: certificate.recipientName,
        course: certificate.course,
        issuer: certificate.issuer,
        issueDate: String(certificate.issueDate).slice(0, 10),
        status,
      });

      setMessage(`Certificate status changed to ${status}.`);
      await loadCertificates();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update status."
      );
    }
  };

  const handleDelete = async (certificate) => {
    const confirmed = window.confirm(
      `Delete certificate ${certificate.certificateId}? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/certificates/${certificate._id}`);
      setMessage("Certificate deleted successfully.");
      await loadCertificates();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete certificate."
      );
    }
  };

  const getVerificationUrl = (certificate) =>
    `${window.location.origin}/verify?id=${encodeURIComponent(
      certificate.certificateId
    )}`;

  const downloadQRCode = (certificate) => {
    const svg = document.getElementById(`qr-${certificate._id}`);

    if (!svg) {
      setError("Unable to find the QR code.");
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${certificate.certificateId}-QR.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async (certificate) => {
    setError("");
    setMessage("");
    setDownloadingId(certificate._id);

    try {
      await generateCertificatePDF(certificate);
      setMessage(`PDF downloaded for ${certificate.certificateId}.`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("Unable to generate the PDF. Check the PDF generator and installed libraries.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="container py-4">
      <nav className="d-flex justify-content-between align-items-center mb-4">
        <Brand />
        <Link to="/admin" className="btn btn-outline-secondary">
          Admin Dashboard
        </Link>
      </nav>

      <h1 className="fw-bold mb-4">Manage Certificates</h1>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {message && <div className="alert alert-success" role="status">{message}</div>}

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="fw-bold mb-3">
            {editingId ? "Edit Certificate" : "Add Certificate"}
          </h5>

          {users.length === 0 && (
            <div className="alert alert-info">
              No registered users are available. Register a normal user before assigning a certificate.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label htmlFor="userId" className="form-label">Assign to Registered User</label>
                <select
                  id="userId"
                  name="userId"
                  className="form-select"
                  value={form.userId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a user</option>
                  {users.filter((user) => user.role === "user").map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="certificateId" className="form-label">Certificate ID</label>
                <input id="certificateId" name="certificateId" className="form-control" value={form.certificateId} onChange={handleChange} required />
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="recipientName" className="form-label">Recipient Name</label>
                <input id="recipientName" name="recipientName" className="form-control" value={form.recipientName} readOnly required />
                <small className="text-muted">Automatically filled from the selected user's registered name.</small>
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="course" className="form-label">Course</label>
                <input id="course" name="course" className="form-control" value={form.course} onChange={handleChange} required />
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="issuer" className="form-label">Issuer</label>
                <input id="issuer" name="issuer" className="form-control" value={form.issuer} onChange={handleChange} required />
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="issueDate" className="form-label">Issue Date</label>
                <input id="issueDate" name="issueDate" type="date" className="form-control" value={form.issueDate} onChange={handleChange} required />
              </div>

              <div className="col-12 col-md-6">
                <label htmlFor="status" className="form-label">Status</label>
                <select id="status" name="status" className="form-select" value={form.status} onChange={handleChange}>
                  <option value="Valid">Valid</option>
                  <option value="Revoked">Revoked</option>
                </select>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-4">
              <button type="submit" className="btn btn-primary" disabled={saving || users.filter((user) => user.role === "user").length === 0}>
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Certificate"}
              </button>

              {editingId && (
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <h4 className="fw-bold mb-3">Registered Certificates</h4>

      {loading ? (
        <p>Loading certificates...</p>
      ) : certificates.length === 0 ? (
        <div className="alert alert-info">No certificates found.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Certificate ID</th>
                <th>Recipient</th>
                <th>Course</th>
                <th>Issuer</th>
                <th>Issue Date</th>
                <th>Status</th>
                <th>QR Code</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((certificate) => (
                <tr key={certificate._id}>
                  <td>{certificate.certificateId}</td>
                  <td>{certificate.recipientName}</td>
                  <td>{certificate.course}</td>
                  <td>{certificate.issuer}</td>
                  <td>{certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : "—"}</td>
                  <td>
                    <span className={`badge ${certificate.status === "Valid" ? "text-bg-success" : "text-bg-danger"}`}>
                      {certificate.status}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex flex-column align-items-center gap-2 certificate-qr-cell">
                      <div className="certificate-qr-preview">
                        <QRCodeSVG id={`qr-${certificate._id}`} value={getVerificationUrl(certificate)} size={100} level="H" includeMargin />
                      </div>
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => downloadQRCode(certificate)}>
                        Download QR
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-2 certificate-actions">
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(certificate)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => handleStatusChange(certificate, certificate.status === "Valid" ? "Revoked" : "Valid")}>
                        {certificate.status === "Valid" ? "Revoke" : "Restore"}
                      </button>
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => handleDownloadPDF(certificate)} disabled={downloadingId === certificate._id}>
                        {downloadingId === certificate._id ? "Generating..." : "Download PDF"}
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(certificate)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Certificates;
