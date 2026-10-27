
import { useState } from "react";
import API_URL from "../../api";

export default function ManageHR() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const createHR = async (event) => {
    event.preventDefault();
    setMessage("");

    const user = JSON.parse(
      localStorage.getItem("crmUser") || "null"
    );

    if (!user || user.role !== "ADMIN") {
      setMessage("Only Admin can create HR accounts.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/hr/create`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to create HR account.");
        return;
      }

      setMessage(data.message || "HR account created successfully.");
      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessage(
        "Cannot connect to the backend. Please check that it is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "24px" }}>
      <h2>Manage HR</h2>
      <p>Create an HR employee account.</p>

      <form onSubmit={createHR}>
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="hr-name">Full Name</label>
          <input
            id="hr-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: "10px", marginTop: "6px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="hr-email">Email</label>
          <input
            id="hr-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: "10px", marginTop: "6px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="hr-password">Temporary Password</label>
          <input
            id="hr-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            style={{ display: "block", width: "100%", padding: "10px", marginTop: "6px" }}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create HR Account"}
        </button>
      </form>

      {message && <p role="status">{message}</p>}
    </div>
  );
}
