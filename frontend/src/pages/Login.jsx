import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Brand from "../components/Brand";
import normalizeEmail from "../utils/normalizeEmail";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: normalizeEmail(email),
        password,
      });

      const user = response.data.user;
      const requestedPath = location.state?.from?.pathname;

      const allowedDestination =
        user.role === "admin"
          ? ["/admin", "/admin/certificates", "/admin/users", "/change-password"]
          : ["/dashboard", "/change-password"];

      const destination = allowedDestination.includes(requestedPath)
        ? requestedPath
        : user.role === "admin"
          ? "/admin"
          : "/dashboard";

      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: "480px" }}>
      <div className="text-center mb-4">
        <Brand />
        <h2 className="fw-bold mt-4" style={{ color: "#033e95" }}>
          Welcome back
        </h2>
        <p className="text-secondary">Log in to your cerver account.</p>
      </div>

      <form className="card card-body shadow-sm" onSubmit={handleSubmit}>
        {location.state?.message && (
          <div className="alert alert-success">{location.state.message}</div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        <label htmlFor="email" className="form-label">Email address</label>
        <input
          id="email"
          type="text"
          className="form-control mb-3"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="password" className="form-label">Password</label>
        <div className="input-group mb-3">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            className="form-control"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center mt-3 mb-0">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
