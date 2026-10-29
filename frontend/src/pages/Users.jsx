import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Brand from "../components/Brand";

function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/auth/users");
      setUsers(response.data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDelete = async (user) => {
    if (user.role === "admin") {
      setError("Administrator accounts cannot be deleted here.");
      return;
    }

    if (!window.confirm(`Delete the account for ${user.name}?`)) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.delete(`/auth/users/${user._id}`);
      setMessage("User deleted successfully.");
      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete user."
      );
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

      <h1 className="fw-bold mb-4">Manage Users</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {loading ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <div className="alert alert-info">No registered users found.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Registered</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user._id || user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    {user.role === "admin" ? (
                      <span className="text-secondary">Protected</span>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(user)}
                      >
                        Delete User
                      </button>
                    )}
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

export default Users;
