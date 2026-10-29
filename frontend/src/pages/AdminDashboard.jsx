import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Brand from "../components/Brand";

function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      navigate("/", { replace: true });
    }
  };

  const actions = [
    {
      icon: "▤",
      title: "Manage Certificates",
      description: "Create, review, update, and delete digital certificates.",
      label: "Open Certificates",
      to: "/admin/certificates",
      primary: true,
    },
    {
      icon: "♙",
      title: "Manage Users",
      description: "View registered users and manage normal-user accounts.",
      label: "Open Users",
      to: "/admin/users",
      primary: true,
    },
    {
      icon: "✓",
      title: "Verify a Certificate",
      description: "Check a certificate's current status using its unique ID.",
      label: "Verify Certificate",
      to: "/verify",
      primary: false,
    },
    {
      icon: "⌑",
      title: "Account Security",
      description: "Update your password to help keep your account secure.",
      label: "Change Password",
      to: "/change-password",
      primary: false,
    },
  ];

  return (
    <main className="container py-4 py-md-5">
      <nav className="d-flex justify-content-between align-items-center mb-4 mb-md-5">
        <Brand />
        <button className="btn btn-outline-danger" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      <section className="cerver-admin-header mb-4 mb-md-5">
        <div>
          <div className="cerver-eyebrow">Administration</div>
          <h1 className="fw-bold">Admin Dashboard</h1>
          <p className="mb-0">Manage certificates, users, and verification from one place.</p>
        </div>
        <Link to="/verify" className="btn btn-primary">
          Verify a certificate <span aria-hidden="true">↗</span>
        </Link>
      </section>

      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="h4 mb-1">Quick actions</h2>
          <p className="text-secondary mb-0">Choose a task to get started.</p>
        </div>
      </div>

      <div className="row g-3 g-lg-4">
        {actions.map((action) => (
          <div className="col-12 col-md-6" key={action.title}>
            <article className="card cerver-admin-card">
              <div className="card-body">
                <div className="cerver-admin-icon" aria-hidden="true">{action.icon}</div>
                <h5 className="fw-bold">{action.title}</h5>
                <p>{action.description}</p>
                <Link
                  to={action.to}
                  className={`btn ${action.primary ? "btn-primary" : "btn-outline-primary"}`}
                >
                  {action.label} <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          </div>
        ))}
      </div>
    </main>
  );
}

export default AdminDashboard;
