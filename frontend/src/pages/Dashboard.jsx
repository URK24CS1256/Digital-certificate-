import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Brand from "../components/Brand";
import generateCertificatePDF from "../utils/generateCertificatePDF";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [error, setError] = useState("");
  const [certificateError, setCertificateError] = useState("");
  const [loadingCertificates, setLoadingCertificates] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  const loadCertificates = useCallback(async () => {
    setLoadingCertificates(true);
    setCertificateError("");

    try {
      const response = await api.get("/certificates");
      const data = response.data;

      setCertificates(
        Array.isArray(data) ? data : data.certificates || []
      );
    } catch (err) {
      setCertificateError(
        err.response?.data?.message ||
          "Unable to load your certificates."
      );
    } finally {
      setLoadingCertificates(false);
    }
  }, []);

  useEffect(() => {
    api.get("/auth/me")
      .then((response) => setUser(response.data.user))
      .catch(() => setError("Unable to load account details."));

    loadCertificates();
  }, [loadCertificates]);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await api.post("/auth/logout");
    } finally {
      navigate("/", { replace: true });
    }
  };

  const handleDownloadPDF = async (certificate) => {
    setCertificateError("");
    setDownloadingId(certificate._id);

    try {
      await generateCertificatePDF(certificate);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setCertificateError("Unable to generate the certificate PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="container py-4">
      <nav className="d-flex justify-content-between align-items-center mb-5">
        <Brand />

        <button
          className="btn btn-outline-danger"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </nav>

      <h1 className="fw-bold">User Dashboard</h1>
      <p className="text-secondary">
        Welcome to your Cerver account.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm mt-4">
        <div className="card-body">
          <h5 className="fw-bold mb-3">Account Details</h5>

          {user ? (
            <>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p className="mb-0">
                <strong>Role:</strong> {user.role}
              </p>
            </>
          ) : (
            !error && <p>Loading account details...</p>
          )}
        </div>
      </div>

      <div className="d-flex gap-3 flex-wrap mt-4">
        <Link to="/verify" className="btn btn-primary">
          Verify Certificate
        </Link>

        <Link
          to="/change-password"
          className="btn btn-outline-primary"
        >
          Change Password
        </Link>
      </div>

      <section className="mt-5">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div>
            <h2 className="fw-bold mb-1">My Certificates</h2>
            <p className="text-secondary mb-0">
              Certificates assigned to your account.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={loadCertificates}
            disabled={loadingCertificates}
          >
            {loadingCertificates ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {certificateError && (
          <div className="alert alert-danger">
            {certificateError}
          </div>
        )}

        {loadingCertificates ? (
          <p>Loading your certificates...</p>
        ) : certificates.length === 0 ? (
          <div className="alert alert-info">
            You don't have any assigned certificates yet.
          </div>
        ) : (
          <div className="row g-3">
            {certificates.map((certificate) => (
              <div
                className="col-12 col-md-6 col-xl-4"
                key={certificate._id}
              >
                <div className="card h-100 shadow-sm">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                      <h5 className="fw-bold mb-0">
                        {certificate.course}
                      </h5>

                      <span
                        className={`badge ${
                          certificate.status === "Valid"
                            ? "text-bg-success"
                            : "text-bg-danger"
                        }`}
                      >
                        {certificate.status}
                      </span>
                    </div>

                    <p className="mb-2">
                      <strong>Certificate ID:</strong>{" "}
                      {certificate.certificateId}
                    </p>

                    <p className="mb-2">
                      <strong>Recipient:</strong>{" "}
                      {certificate.recipientName}
                    </p>

                    <p className="mb-2">
                      <strong>Issuer:</strong> {certificate.issuer}
                    </p>

                    <p className="mb-3">
                      <strong>Issue Date:</strong>{" "}
                      {certificate.issueDate
                        ? new Date(
                            certificate.issueDate
                          ).toLocaleDateString()
                        : "—"}
                    </p>

                    <div className="mt-auto d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleDownloadPDF(certificate)}
                        disabled={
                          downloadingId === certificate._id
                        }
                      >
                        {downloadingId === certificate._id
                          ? "Generating PDF..."
                          : "Download PDF"}
                      </button>

                      <Link
                        to={`/verify?id=${encodeURIComponent(
                          certificate.certificateId
                        )}`}
                        className="btn btn-outline-secondary"
                      >
                        Verify
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
