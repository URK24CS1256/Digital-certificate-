import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";

import Brand from "./components/Brand";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Certificates from "./pages/Certificates";
import Users from "./pages/Users";
import VerifyCertificate from "./pages/VerifyCertificate";
import ChangePassword from "./pages/ChangePassword";
import InteractiveLinesBackground from "./components/InteractiveLinesBackground";

function Home() {
  return (
    <main className="container py-4 py-md-5 cerver-home">
      <header className="d-flex justify-content-center mb-4 mb-md-5">
        <Brand />
      </header>

      <section className="cerver-home-hero">
        <div className="cerver-home-copy">
          <div className="cerver-eyebrow">Trusted digital credentials</div>
          <h1 className="cerver-home-title">
            Every certificate.<br />
            <span>Verified with confidence.</span>
          </h1>
          <p className="cerver-home-description">
            Check certificate authenticity in seconds with a simple, secure verification process.
          </p>
          <div className="cerver-home-actions">
            <Link to="/verify" className="btn btn-primary">
              Verify Certificate <span aria-hidden="true">→</span>
            </Link>
            <Link to="/login" className="btn btn-outline-primary">Login</Link>
            <Link to="/signup" className="btn btn-outline-secondary">Create Account</Link>
          </div>
          <div className="cerver-home-proof" aria-label="Key benefits">
            <span>Simple verification</span>
            <span>Clear status results</span>
            <span>Secure access</span>
          </div>
        </div>

        <div className="cerver-certificate-art" aria-label="Illustration of a verified digital certificate" role="img">
          <div className="cerver-certificate-paper">
            <div className="cerver-paper-top">
              <span>Cerver credentials</span>
              <span className="cerver-paper-seal" aria-hidden="true">✦</span>
            </div>
            <h2 className="cerver-paper-title">Certificate</h2>
            <p className="cerver-paper-subtitle">OF ACHIEVEMENT</p>
            <div className="cerver-paper-rule" />
            <p className="cerver-paper-name">Digitally verified</p>
            <p className="cerver-paper-subtitle">A credential you can check with confidence</p>
            <div className="cerver-paper-footer">
              <span>AUTHENTICITY CHECK</span>
              <span>CVR • VERIFIED</span>
            </div>
          </div>
          <div className="cerver-verified-chip">
            <span className="cerver-verified-check" aria-hidden="true">✓</span>
            <span><strong>Verification ready</strong><small>Check a certificate ID</small></span>
          </div>
        </div>
      </section>

      <section className="cerver-home-features" aria-label="How Cerver helps">
        <article className="cerver-feature">
          <div className="cerver-feature-mark" aria-hidden="true">⌕</div>
          <h3>Quick checks</h3>
          <p>Enter a certificate ID to check its recorded status.</p>
        </article>
        <article className="cerver-feature">
          <div className="cerver-feature-mark" aria-hidden="true">✓</div>
          <h3>Clear results</h3>
          <p>Understand whether a certificate is valid or revoked.</p>
        </article>
        <article className="cerver-feature">
          <div className="cerver-feature-mark" aria-hidden="true">⌑</div>
          <h3>Role-based access</h3>
          <p>Authorized administrators can manage certificate records.</p>
        </article>
      </section>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <InteractiveLinesBackground />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<VerifyCertificate />} />

        <Route element={<ProtectedRoute allowedRole="user" />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/certificates" element={<Certificates />} />
          <Route path="/admin/users" element={<Users />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
