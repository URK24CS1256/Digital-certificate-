import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Brand from "../components/Brand";
import normalizeEmail from "../utils/normalizeEmail";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/signup", {
        name: name.trim(),
        email: normalizeEmail(email),
        password,
      });

      navigate("/login", {
        replace: true,
        state: { message: "Account created successfully. Please log in." },
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: "480px" }}>
      <div className="text-center mb-4">
        <Brand />
        <h2 className="fw-bold mt-4">Create your account</h2>
      </div>

      <form className="card card-body shadow-sm" onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger">{error}</div>}

        <label htmlFor="name" className="form-label">Full name</label>
        <input
          id="name"
          className="form-control mb-3"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
        />

        <label htmlFor="email" className="form-label">Email address</label>
        <input
          id="email"
          type="text"
          className="form-control mb-3"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />

        <label htmlFor="password" className="form-label">Password</label>
        <input
          id="password"
          type={showPasswords ? "text" : "password"}
          className="form-control mb-1"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
        <small className="text-secondary mb-3">
          At least 8 characters, with uppercase, lowercase and a number.
        </small>

        <label htmlFor="confirmPassword" className="form-label">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type={showPasswords ? "text" : "password"}
          className="form-control mb-3"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          required
        />

        <div className="form-check mb-3">
          <input
            id="showPasswords"
            type="checkbox"
            className="form-check-input"
            checked={showPasswords}
            onChange={(event) => setShowPasswords(event.target.checked)}
          />
          <label htmlFor="showPasswords" className="form-check-label">
            Show passwords
          </label>
        </div>

        <button className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="text-center mt-3 mb-0">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}

export default Signup;
