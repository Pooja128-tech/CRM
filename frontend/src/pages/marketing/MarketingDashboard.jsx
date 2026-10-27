import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../api";
import "./MarketingDashboard.css";

function MarketingDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("crmUser") || "null");

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    interestedCourse: "",
    source: "Website",
  });

  const loadLeads = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/leads`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(data.message || "Unable to load enquiries.");
      }

      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role?.toUpperCase() === "MARKETING") {
      loadLeads();
    }
  }, []);

  // Close the mobile sidebar with the Escape key
  useEffect(() => {
    if (!sidebarOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/leads`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: "NEW",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to save enquiry.");
      }

      setMessage("Enquiry saved successfully!");
      setFormData({
        name: "",
        email: "",
        phone: "",
        interestedCourse: "",
        source: "Website",
      });

      await loadLeads();
    } catch (err) {
      setError(err.message || "Unable to save enquiry.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      localStorage.removeItem("crmUser");
      navigate("/");
    }
  };

  const openSection = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);
    setMessage("");
    setError("");

    if (section === "enquiries") {
      loadLeads();
    }
  };

  if (!user || user.role?.toUpperCase() !== "MARKETING") {
    return null;
  }

  const newCount = leads.filter(
    (lead) => (lead.status || "NEW").toUpperCase() === "NEW"
  ).length;

  const inProgressCount = leads.filter((lead) =>
    ["CONTACTED", "INTERESTED", "FOLLOW_UP", "DEMO_SCHEDULED"].includes(
      (lead.status || "").toUpperCase()
    )
  ).length;

  const admittedCount = leads.filter(
    (lead) => (lead.status || "").toUpperCase() === "ADMITTED"
  ).length;

  const navItems = [
    { id: "dashboard", icon: "▦", label: "Dashboard" },
    { id: "enquiries", icon: "☷", label: "My Enquiries" },
    { id: "add", icon: "＋", label: "Add Enquiry" },
  ];

  const pageTitles = {
    dashboard: "Marketing Dashboard",
    enquiries: "My Enquiries",
    add: "Add New Enquiry",
  };

  return (
    <div className="marketing-dashboard">
      {sidebarOpen && (
        <button
          className="marketing-sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`marketing-sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="marketing-sidebar-brand">
          <div className="marketing-logo">IZ</div>

          <div>
            <h2>IZEON</h2>
            <span>CRM PLATFORM</span>
          </div>

          <button
            className="marketing-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        <p className="marketing-nav-caption">WORKSPACE</p>

        <nav className="marketing-navigation" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`marketing-nav-item ${
                activeSection === item.id ? "active" : ""
              }`}
              aria-current={activeSection === item.id ? "page" : undefined}
              onClick={() => openSection(item.id)}
            >
              <span className="marketing-nav-icon">{item.icon}</span>
              <span>{item.label}</span>

              {item.id === "enquiries" && (
                <span className="marketing-nav-count">{leads.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="marketing-sidebar-bottom">
          <div className="marketing-profile">
            <div className="marketing-avatar">
              {(user.name || "M").charAt(0).toUpperCase()}
            </div>

            <div className="marketing-profile-info">
              <strong>{user.name}</strong>
              <span>Marketing Team</span>
            </div>

          </div>

          <button
            type="button"
            className="marketing-logout-btn"
            onClick={handleLogout}
          >
            <span aria-hidden="true">⎋</span>
            Logout
          </button>
        </div>
      </aside>

      <div className="marketing-workspace">
        <header className="marketing-topbar">
          <div className="marketing-topbar-left">
            <button
              className="marketing-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>

            <div>
              <span className="marketing-breadcrumb">
                Workspace / Marketing
              </span>
              <h1>{pageTitles[activeSection]}</h1>
            </div>
          </div>

          <div className="marketing-topbar-actions">
            <button
              className="marketing-topbar-refresh"
              onClick={loadLeads}
              disabled={loading}
            >
              <span className={loading ? "marketing-spinning" : ""}>↻</span>
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              className="marketing-topbar-refresh marketing-topbar-logout"
              onClick={handleLogout}
            >
              <span aria-hidden="true">⎋</span>
              Logout
            </button>
          </div>
        </header>

        <main className="marketing-main">
          {error && (
            <div className="marketing-message marketing-error" role="alert">
              {error}
            </div>
          )}

          {message && (
            <div className="marketing-message marketing-success" role="status">
              {message}
            </div>
          )}

          {/* Screen 1: Dashboard (welcome banner + four statistics cards) */}
          {activeSection === "dashboard" && (
            <div className="marketing-page marketing-dashboard-page">
              <section className="marketing-welcome">
                <div>
                  <span className="marketing-eyebrow">YOUR WORKSPACE</span>
                  <h2>
                    Welcome back, {user.name?.split(" ")[0] || "there"}!{" "}
                    <span>✦</span>
                  </h2>
                  <p>
                    Track your enquiries, build connections, and grow your
                    pipeline.
                  </p>
                </div>

                <div className="marketing-welcome-art" aria-hidden="true">
                  <div className="marketing-art-circle">↗</div>
                  <div className="marketing-art-dot dot-one" />
                  <div className="marketing-art-dot dot-two" />
                </div>
              </section>

              <section className="marketing-stats">
                <article className="marketing-stat-card stat-blue">
                  <div className="marketing-stat-top">
                    <span>Total Enquiries</span>
                    <span className="marketing-stat-icon">☷</span>
                  </div>
                  <h3>{leads.length}</h3>
                  <p>All your enquiries</p>
                  <div className="marketing-stat-progress">
                    <span style={{ width: leads.length ? "100%" : "0%" }} />
                  </div>
                </article>

                <article className="marketing-stat-card stat-orange">
                  <div className="marketing-stat-top">
                    <span>New Enquiries</span>
                    <span className="marketing-stat-icon">✧</span>
                  </div>
                  <h3>{newCount}</h3>
                  <p>Waiting for follow-up</p>
                  <div className="marketing-stat-progress">
                    <span
                      style={{
                        width: `${
                          leads.length ? (newCount / leads.length) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </article>

                <article className="marketing-stat-card stat-purple">
                  <div className="marketing-stat-top">
                    <span>In Progress</span>
                    <span className="marketing-stat-icon">◷</span>
                  </div>
                  <h3>{inProgressCount}</h3>
                  <p>Contacted and progressing</p>
                  <div className="marketing-stat-progress">
                    <span
                      style={{
                        width: `${
                          leads.length
                            ? (inProgressCount / leads.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </article>

                <article className="marketing-stat-card stat-green">
                  <div className="marketing-stat-top">
                    <span>Admissions</span>
                    <span className="marketing-stat-icon">✓</span>
                  </div>
                  <h3>{admittedCount}</h3>
                  <p>Successfully admitted</p>
                  <div className="marketing-stat-progress">
                    <span
                      style={{
                        width: `${
                          leads.length ? (admittedCount / leads.length) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </article>
              </section>
            </div>
          )}

          {/* Screen 2: Add Enquiry (heading + form only) */}
          {activeSection === "add" && (
            <div className="marketing-page marketing-add-page">
              <section className="marketing-section">
                <div className="marketing-section-heading">
                  <div>
                    <span className="marketing-section-kicker">GET STARTED</span>
                    <h3>Create a new enquiry</h3>
                    <p>
                      Enter the student's details to add a new lead to your
                      pipeline.
                    </p>
                  </div>

                  <span className="marketing-section-symbol">＋</span>
                </div>

                <form className="marketing-form" onSubmit={handleSubmit}>
                  <div className="marketing-form-group">
                    <label htmlFor="lead-name">Student Name *</label>
                    <input
                      id="lead-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter student name"
                      required
                    />
                  </div>

                  <div className="marketing-form-group">
                    <label htmlFor="lead-email">Email Address</label>
                    <input
                      id="lead-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="student@example.com"
                    />
                  </div>

                  <div className="marketing-form-group">
                    <label htmlFor="lead-phone">Phone Number *</label>
                    <input
                      id="lead-phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>

                  <div className="marketing-form-group">
                    <label htmlFor="lead-course">Interested Course *</label>
                    <input
                      id="lead-course"
                      type="text"
                      name="interestedCourse"
                      value={formData.interestedCourse}
                      onChange={handleChange}
                      placeholder="Example: Java Full Stack"
                      required
                    />
                  </div>

                  <div className="marketing-form-group">
                    <label htmlFor="lead-source">Enquiry Source *</label>
                    <select
                      id="lead-source"
                      name="source"
                      value={formData.source}
                      onChange={handleChange}
                      required
                    >
                      <option value="Website">Website</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Google Ads">Google Ads</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Walk-in">Walk-in</option>
                      <option value="Referral">Referral</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="marketing-form-actions">
                    <button
                      type="submit"
                      className="marketing-btn"
                      disabled={saving}
                    >
                      {saving ? "Saving enquiry..." : "＋ Save Enquiry"}
                    </button>

                    <button
                      type="button"
                      className="marketing-btn marketing-secondary-btn"
                      disabled={saving}
                      onClick={() => {
                        setFormData({
                          name: "",
                          email: "",
                          phone: "",
                          interestedCourse: "",
                          source: "Website",
                        });
                        setMessage("");
                        setError("");
                      }}
                    >
                      Clear Form
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}

          {/* Screen 3: My Enquiries (heading + table only) */}
          {activeSection === "enquiries" && (
            <div className="marketing-page marketing-enquiries-page">
              <section className="marketing-section">
                <div className="marketing-section-heading marketing-list-heading">
                  <div>
                    <span className="marketing-section-kicker">
                      YOUR PIPELINE
                    </span>
                    <h3>My Enquiries</h3>
                    <p>
                      View the latest enquiry details and statuses from your
                      account.
                    </p>
                  </div>

                  <span className="marketing-table-total">
                    {leads.length} records
                  </span>
                </div>

                {loading ? (
                  <div className="marketing-loading">
                    <span className="marketing-loader" />
                    <p>Loading your enquiries...</p>
                  </div>
                ) : leads.length === 0 ? (
                  <div className="marketing-empty">
                    <span>☷</span>
                    <h4>No enquiries yet</h4>
                    <p>Add your first enquiry from the Add Enquiry screen.</p>
                  </div>
                ) : (
                  <div className="marketing-table-wrapper">
                    <table className="marketing-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Student</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Course</th>
                          <th>Source</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {leads.map((lead) => {
                          const status = String(
                            lead.status ?? "NEW"
                          ).toUpperCase();

                          const statusClass = status
                            .toLowerCase()
                            .replaceAll("_", "-");

                          return (
                            <tr key={lead.id} className="marketing-table-row">
                              <td className="marketing-id">#{lead.id}</td>
                              <td className="marketing-student-name">
                                {lead.name}
                              </td>
                              <td>{lead.email || "—"}</td>
                              <td>{lead.phone || "—"}</td>
                              <td>{lead.interestedCourse || "—"}</td>
                              <td>{lead.source || "—"}</td>
                              <td>
                                <span
                                  className={`marketing-status status-${statusClass}`}
                                >
                                  <span className="marketing-status-dot" />
                                  {status.replaceAll("_", " ")}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          <footer className="marketing-footer">
            <span>IZEON CRM</span> · Marketing Workspace
          </footer>
        </main>
      </div>
    </div>
  );
}

export default MarketingDashboard;