import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import api from "../api/axios";

function ProtectedRoute({ allowedRole }) {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let active = true;

    api
      .get("/auth/me")
      .then((response) => {
        if (!active) return;
        setUser(response.data.user);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setStatus("unauthenticated");
      });

    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3">Checking your session...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (allowedRole && user?.role !== allowedRole) {
    return (
      <Navigate
        to={user?.role === "admin" ? "/admin" : "/dashboard"}
        replace
      />
    );
  }

  return <Outlet context={{ user }} />;
}

export default ProtectedRoute;
