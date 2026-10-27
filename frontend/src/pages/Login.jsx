
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Login failed. Please try again.");
        return;
      }

      const role = data.role?.toUpperCase();

      if (
        role !== "ADMIN" &&
        role !== "HR" &&
        role !== "MARKETING"
      ) {
        setError("Invalid user role.");
        return;
      }

      localStorage.setItem(
        "crmUser",
        JSON.stringify({
          ...data,
          role,
        })
      );

      if (role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (role === "HR") {
        navigate("/hr/dashboard");
      } else if (role === "MARKETING") {
        navigate("/marketing/dashboard");
      }
    } catch (error) {
      setError(
        "Unable to connect to the server. Please check the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>IZEON CRM</h1>

        <p className="login-subtitle">
          Manage Leads. Close Deals. Grow Faster.
        </p>

        <h2>Welcome Back</h2>
        <p>Sign in to your account</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email Address</label>

          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="login-footer">
          Secure access for Admin, HR and Marketing
        </p>
      </div>
    </div>
  );
}

export default Login;
