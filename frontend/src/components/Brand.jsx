import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

function Brand({ light = false }) {
  const [homePath, setHomePath] = useState("/");

  useEffect(() => {
    let active = true;

    api
      .get("/auth/me")
      .then((response) => {
        if (!active) return;

        const role = response.data.user?.role;

        if (role === "admin") {
          setHomePath("/admin");
        } else if (role === "user") {
          setHomePath("/dashboard");
        }
      })
      .catch(() => {
        if (active) setHomePath("/");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <Link
      to={homePath}
      className={`cerver-brand ${light ? "cerver-brand-light" : ""}`}
      aria-label="cerver dashboard"
      title="Go to dashboard"
    >
      <span className="cerver-brand-name">
        <span>cer</span>
        <span>ver</span>
      </span>

      <span className="cerver-brand-accent" aria-hidden="true" />
    </Link>
  );
}

export default Brand;
