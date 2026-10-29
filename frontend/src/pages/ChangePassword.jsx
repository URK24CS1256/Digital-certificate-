import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Brand from "../components/Brand";

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      setError(
        "Password must have at least 8 characters, an uppercase letter, a lowercase letter and a number."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setSuccess(
        response.data.message || "Password changed successfully."
      );

      // Backend clears the session cookie after changing the password.
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to change password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: "600px" }}>
      <div className="d-flex justify-content-between align-items-center mb-5">
        <Brand />
        <Link to="/" className="btn btn-outline-secondary">Home</Link>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <h2 className="fw-bold">Change Password</h2>
          <p className="text-secondary">
            Choose a strong password for your account.
          </p>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <label htmlFor="currentPassword" className="form-label">
              Current password
            </label>
            <input
              id="currentPassword"
              type={showPasswords ? "text" : "password"}
              className="form-control mb-3"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <label htmlFor="newPassword" className="form-label">
              New password
            </label>
            <input
              id="newPassword"
              type={showPasswords ? "text" : "password"}
              className="form-control mb-3"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            <label htmlFor="confirmPassword" className="form-label">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type={showPasswords ? "text" : "password"}
              className="form-control mb-3"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            <div className="form-check mb-3">
              <input
                id="showPasswords"
                type="checkbox"
                className="form-check-input"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
              />
              <label htmlFor="showPasswords" className="form-check-label">
                Show passwords
              </label>
            </div>

            <button className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;
