
import { useState, useEffect } from "react";
import "../../App.css";
import "./AdminDashboard.css";
import API_URL from "../../api";

// Automatically include the login session cookie in every API request.
const apiFetch = (url, options = {}) =>
  fetch(url, { ...options, credentials: "include" });

function App() {
  const handleLogout = async () => {
    try {
      await apiFetch(`${API_URL}/auth/logout`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("crmUser");
      window.location.href = "/";
    }
  };

  const [activeSection, setActiveSection] = useState("overview");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);

  // Separate Marketing Leads state
  const [marketingLeads, setMarketingLeads] = useState([]);
  const [marketingLoading, setMarketingLoading] = useState(true);
  const [marketingError, setMarketingError] = useState("");

  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadCourse, setLeadCourse] = useState("");
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadMessage, setLeadMessage] = useState("");
  const [leadError, setLeadError] = useState("");

  const [editingLead, setEditingLead] = useState(null);
  const [editLeadForm, setEditLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    interestedCourse: "",
    status: "NEW",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [editError, setEditError] = useState("");
  const [deletingLeadId, setDeletingLeadId] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [admissions, setAdmissions] = useState([]);
  const [admissionLoading, setAdmissionLoading] = useState(true);
  const [admissionError, setAdmissionError] = useState("");

  const [hrName, setHrName] = useState("");
  const [hrEmail, setHrEmail] = useState("");
  const [hrPassword, setHrPassword] = useState("");
  const [hrLoading, setHrLoading] = useState(false);
  const [hrMessage, setHrMessage] = useState("");
  const [hrError, setHrError] = useState("");

  // Marketing account creation state
  const [marketingName, setMarketingName] = useState("");
  const [marketingEmail, setMarketingEmail] = useState("");
  const [marketingPassword, setMarketingPassword] = useState("");
  const [marketingAccountLoading, setMarketingAccountLoading] = useState(false);
  const [marketingMessage, setMarketingMessage] = useState("");
  const [marketingAccountError, setMarketingAccountError] = useState("");

  const getToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;
  };

  const today = getToday();

  // Fetch all existing leads for the current Admin workflows.
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiFetch(`${API_URL}/leads`);

        if (!response.ok) {
          throw new Error("Failed to load leads.");
        }

        const data = await response.json();
        setLeads(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Unable to load leads.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Fetch Marketing leads independently from the Marketing endpoint.
  useEffect(() => {
    const fetchMarketingLeads = async () => {
      try {
        setMarketingLoading(true);
        setMarketingError("");

        const response = await apiFetch(
          `${API_URL}/leads/marketing-leads`
        );

        if (!response.ok) {
          throw new Error("Failed to load Marketing leads.");
        }

        const data = await response.json();
        setMarketingLeads(Array.isArray(data) ? data : []);
      } catch (err) {
        setMarketingError(
          err.message || "Unable to load Marketing leads."
        );
      } finally {
        setMarketingLoading(false);
      }
    };

    fetchMarketingLeads();
  }, []);

  // Refresh Marketing Leads after changes or when opening that section.
  const refreshMarketingLeads = async () => {
    try {
      setMarketingError("");

      const response = await apiFetch(
        `${API_URL}/leads/marketing-leads`
      );

      if (!response.ok) {
        throw new Error("Failed to refresh Marketing leads.");
      }

      const data = await response.json();
      setMarketingLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      setMarketingError(
        err.message || "Unable to refresh Marketing leads."
      );
    }
  };

  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        setAdmissionLoading(true);
        setAdmissionError("");

        const response = await apiFetch(`${API_URL}/admissions`);

        if (!response.ok) {
          throw new Error("Failed to load admissions.");
        }

        const data = await response.json();
        setAdmissions(Array.isArray(data) ? data : []);
      } catch (err) {
        setAdmissionError(
          err.message || "Unable to load admission records."
        );
      } finally {
        setAdmissionLoading(false);
      }
    };

    fetchAdmissions();
  }, []);

  const totalLeads = leads.length;
  const totalMarketingLeads = marketingLeads.length;

  const newLeads = leads.filter(
    (l) => String(l.status || "").toUpperCase() === "NEW"
  ).length;

  const contactedLeads = leads.filter(
    (l) => String(l.status || "").toUpperCase() === "CONTACTED"
  ).length;

  const admittedLeads = leads.filter(
    (l) => String(l.status || "").toUpperCase() === "ADMITTED"
  ).length;

  const followUpsDueToday = leads.filter(
    (l) =>
      l.followUpDate &&
      String(l.followUpDate).slice(0, 10) === today &&
      String(l.status || "").toUpperCase() !== "ADMITTED"
  ).length;

  const overdueFollowUps = leads.filter(
    (l) =>
      l.followUpDate &&
      String(l.followUpDate).slice(0, 10) < today &&
      String(l.status || "").toUpperCase() !== "ADMITTED"
  ).length;

  const scheduledDemos = leads.filter(
    (l) =>
      l.demoDate &&
      !["COMPLETED", "CANCELLED"].includes(
        String(l.demoStatus || "").toUpperCase()
      )
  ).length;

  const totalAdmissions = admissions.length;

  const totalCourseFees = admissions.reduce(
    (sum, a) => sum + (Number(a.totalFees) || 0),
    0
  );

  const totalFeesCollected = admissions.reduce(
    (sum, a) => sum + (Number(a.paidFees) || 0),
    0
  );

  const pendingFees = admissions.reduce(
    (sum, a) =>
      sum +
      Math.max(
        (Number(a.totalFees) || 0) - (Number(a.paidFees) || 0),
        0
      ),
    0
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  const readResponse = async (response) => {
    const responseText = await response.text();

    try {
      return responseText ? JSON.parse(responseText) : {};
    } catch {
      return { message: responseText };
    }
  };

  const handleCreateLead = async (event) => {
    event.preventDefault();
    setLeadMessage("");
    setLeadError("");

    if (
      !leadName.trim() ||
      !leadEmail.trim() ||
      !leadPhone.trim() ||
      !leadCourse.trim()
    ) {
      setLeadError("Please fill in all lead details.");
      return;
    }

    try {
      setLeadSaving(true);

      const response = await apiFetch(`${API_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName.trim(),
          email: leadEmail.trim(),
          phone: leadPhone.trim(),
          interestedCourse: leadCourse.trim(),
          status: "NEW",
        }),
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Failed to create lead."
        );
      }

      const leadsResponse = await apiFetch(`${API_URL}/leads`);

      if (!leadsResponse.ok) {
        throw new Error(
          "Lead was created, but the lead list could not be refreshed. Refresh the page to see it."
        );
      }

      const latestLeads = await leadsResponse.json();
      setLeads(Array.isArray(latestLeads) ? latestLeads : []);

      setLeadMessage(
        "Lead created successfully. It is now available in the HR Dashboard."
      );

      setLeadName("");
      setLeadEmail("");
      setLeadPhone("");
      setLeadCourse("");
    } catch (err) {
      setLeadError(err.message || "Unable to create lead.");
    } finally {
      setLeadSaving(false);
    }
  };

  const handleStartEditLead = (lead) => {
    setEditingLead(lead);

    setEditLeadForm({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      interestedCourse: lead.interestedCourse || "",
      status: String(lead.status || "NEW").toUpperCase(),
    });

    setEditMessage("");
    setEditError("");
  };

  const handleCancelEditLead = () => {
    setEditingLead(null);
    setEditMessage("");
    setEditError("");
  };

  const handleUpdateLead = async (event) => {
    event.preventDefault();
    setEditMessage("");
    setEditError("");

    if (
      !editLeadForm.name.trim() ||
      !editLeadForm.email.trim() ||
      !editLeadForm.phone.trim() ||
      !editLeadForm.interestedCourse.trim()
    ) {
      setEditError("Please fill in all lead details.");
      return;
    }

    try {
      setEditSaving(true);

      // Preserve follow-up and demo fields so editing basic details does not erase them.
      const payload = {
        ...editingLead,
        name: editLeadForm.name.trim(),
        email: editLeadForm.email.trim(),
        phone: editLeadForm.phone.trim(),
        interestedCourse: editLeadForm.interestedCourse.trim(),
        status: editLeadForm.status,
      };

      const response = await apiFetch(
        `${API_URL}/leads/${editingLead.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Failed to update lead."
        );
      }

      const leadsResponse = await apiFetch(`${API_URL}/leads`);

      if (!leadsResponse.ok) {
        throw new Error(
          "Lead was updated, but the list could not be refreshed. Refresh the page to see the changes."
        );
      }

      const latestLeads = await leadsResponse.json();
      setLeads(Array.isArray(latestLeads) ? latestLeads : []);

      setEditMessage("Lead updated successfully.");
      setEditingLead(null);
    } catch (err) {
      setEditError(err.message || "Unable to update lead.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteLead = async (lead) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete lead "${
        lead.name || "this lead"
      }" (ID: ${lead.id})? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleteMessage("");
    setDeleteError("");

    try {
      setDeletingLeadId(lead.id);

      const response = await apiFetch(`${API_URL}/leads/${lead.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await readResponse(response);

        throw new Error(
          result.message ||
            result.error ||
            (response.status === 404
              ? "This lead was not found. Refresh the page and try again."
              : "Failed to delete lead. The lead may be linked to an admission record.")
        );
      }

      setLeads((previous) =>
        previous.filter((item) => item.id !== lead.id)
      );

      if (editingLead && editingLead.id === lead.id) {
        setEditingLead(null);
      }

      setDeleteMessage(
        `Lead "${lead.name || lead.id}" deleted successfully.`
      );
    } catch (err) {
      setDeleteError(err.message || "Unable to delete lead.");
    } finally {
      setDeletingLeadId(null);
    }
  };

  const handleCreateHR = async (event) => {
    event.preventDefault();
    setHrMessage("");
    setHrError("");

    if (!hrName.trim() || !hrEmail.trim() || !hrPassword.trim()) {
      setHrError("Please fill in all HR details.");
      return;
    }

    try {
      setHrLoading(true);

      const response = await apiFetch(`${API_URL}/hr/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: hrName.trim(),
          email: hrEmail.trim(),
          password: hrPassword,
        }),
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Failed to create HR account."
        );
      }

      setHrMessage(result.message || "HR account created successfully.");
      setHrName("");
      setHrEmail("");
      setHrPassword("");
    } catch (err) {
      setHrError(err.message || "Unable to create HR account.");
    } finally {
      setHrLoading(false);
    }
  };

  const handleCreateMarketing = async (event) => {
    event.preventDefault();
    setMarketingMessage("");
    setMarketingAccountError("");

    if (
      !marketingName.trim() ||
      !marketingEmail.trim() ||
      !marketingPassword.trim()
    ) {
      setMarketingAccountError(
        "Please fill in all Marketing account details."
      );
      return;
    }

    if (marketingPassword.length < 8) {
      setMarketingAccountError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    try {
      setMarketingAccountLoading(true);

      const response = await apiFetch(`${API_URL}/hr/create-marketing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: marketingName.trim(),
          email: marketingEmail.trim(),
          password: marketingPassword,
        }),
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            "Failed to create Marketing account."
        );
      }

      setMarketingMessage(
        result.message || "Marketing account created successfully."
      );

      setMarketingName("");
      setMarketingEmail("");
      setMarketingPassword("");
    } catch (err) {
      setMarketingAccountError(
        err.message || "Unable to create Marketing account."
      );
    } finally {
      setMarketingAccountLoading(false);
    }
  };

  const availableCourses = [
    ...new Set(
      leads
        .map((l) => l.interestedCourse)
        .filter((c) => c && String(c).trim())
    ),
  ];

  const filteredLeads = [...leads]
    .filter((lead) => {
      const search = searchTerm.trim().toLowerCase();

      const matchesSearch =
        String(lead.name || "").toLowerCase().includes(search) ||
        String(lead.email || "").toLowerCase().includes(search) ||
        String(lead.phone || "").toLowerCase().includes(search);

      const matchesCourse =
        courseFilter === "ALL" ||
        String(lead.interestedCourse || "") === courseFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        String(lead.status || "NEW").toUpperCase() === statusFilter;

      return matchesSearch && matchesCourse && matchesStatus;
    })
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

  const resetLeadFilters = () => {
    setSearchTerm("");
    setCourseFilter("ALL");
    setStatusFilter("ALL");
  };

  const selectSection = (section) => {
    setActiveSection(section);
    setShowLeadForm(section === "add-lead");
    setShowAddForm(section === "create-hr");

    if (section === "add-lead") {
      setLeadMessage("");
      setLeadError("");
    }

    if (section === "create-hr") {
      setHrMessage("");
      setHrError("");
    }

    if (section === "create-marketing") {
      setMarketingMessage("");
      setMarketingAccountError("");
    }

    if (section === "marketing-leads") {
      refreshMarketingLeads();
    }
  };

  const titles = {
    overview: "Dashboard Overview",
    followups: "Follow-up Reports",
    demos: "Demo Class Reports",
    admissions: "Admissions and Fee Reports",
    leads: "Lead Management",
    "marketing-leads": "Marketing Leads",
    "add-lead": "Add New Student Lead",
    "create-hr": "Create HR Account",
    "create-marketing": "Create Marketing Account",
  };

  const statusOptions = [
    ["NEW", "New"],
    ["CONTACTED", "Contacted"],
    ["INTERESTED", "Interested"],
    ["NOT_INTERESTED", "Not Interested"],
    ["FOLLOW_UP", "Follow Up"],
    ["DEMO_SCHEDULED", "Demo Scheduled"],
    ["ADMITTED", "Admitted"],
  ];

  const renderLeadTable = (rows, showActions = false) => (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Interested Course</th>
            <th>Status</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {rows.map((lead) => {
            const status = String(lead.status || "NEW");

            return (
              <tr key={lead.id}>
                <td>{lead.id}</td>
                <td>{lead.name || "-"}</td>
                <td>{lead.email || "-"}</td>
                <td>{lead.phone || "-"}</td>
                <td>{lead.interestedCourse || "-"}</td>
                <td>
                  <span className={`admin-status ${status.toLowerCase()}`}>
                    {status.replaceAll("_", " ")}
                  </span>
                </td>

                {showActions && (
                  <td className="admin-action-cell">
                    <button
                      type="button"
                      className="admin-button edit"
                      onClick={() => handleStartEditLead(lead)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="admin-button delete"
                      onClick={() => handleDeleteLead(lead)}
                      disabled={deletingLeadId === lead.id}
                    >
                      {deletingLeadId === lead.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">I</div>
          <div>
            <strong>IZEON CRM</strong>
            <span>Administration</span>
          </div>
        </div>

        <p className="admin-sidebar-label">WORKSPACE</p>

        <nav
          className="admin-nav"
          aria-label="Admin dashboard navigation"
        >
          {[
            ["overview", "Overview", "◫"],
            ["followups", "Follow-ups", "◷"],
            ["demos", "Demo Classes", "▣"],
            ["admissions", "Admissions", "▤"],
            ["leads", "Lead Management", "♙"],
            ["marketing-leads", "Marketing Leads", "♙"],
            ["add-lead", "Add Lead", "+"],
            ["create-hr", "Create HR", "♧"],
            ["create-marketing", "Create Marketing", "♙"],
          ].map(([id, label, icon]) => (
            <button
              key={id}
              type="button"
              className={`admin-nav-item ${
                activeSection === id ? "active" : ""
              }`}
              onClick={() => selectSection(id)}
            >
              <span className="admin-nav-icon" aria-hidden="true">
                {icon}
              </span>
              <span>{label}</span>
              {activeSection === id && (
                <span className="admin-nav-indicator" />
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-nav-item admin-logout-button"
            onClick={handleLogout}
          >
            <span className="admin-nav-icon" aria-hidden="true">
              ↪
            </span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">IZEON CRM / ADMIN</p>
            <h1>{titles[activeSection]}</h1>
            <p className="admin-subtitle">
              Manage enquiries, follow-ups, demos and admissions.
            </p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-button admin-button-light"
              onClick={() => selectSection("create-hr")}
            >
              + Create HR
            </button>

            <button
              type="button"
              className="admin-button"
              onClick={() => selectSection("add-lead")}
            >
              + Add Lead
            </button>
          </div>
        </header>

        <div className="admin-content" key={activeSection}>
          {activeSection === "overview" && (
            <section className="admin-view admin-animate">
              {error && <p className="admin-message error">{error}</p>}

              {loading ? (
                <p className="admin-muted">Loading lead statistics...</p>
              ) : (
                <>
                  <div className="admin-section-heading">
                    <div>
                      <h2>Lead Overview</h2>
                      <p>Current enquiry pipeline at a glance.</p>
                    </div>
                    <span className="admin-live-pill">
                      <span />
                      Live data
                    </span>
                  </div>

                  <div className="admin-stat-grid">
                    {[
                      [
                        "Total Leads",
                        totalLeads,
                        "All enquiries in CRM",
                        "blue",
                        "↗",
                      ],
                      [
                        "New Leads",
                        newLeads,
                        "Awaiting first contact",
                        "violet",
                        "✦",
                      ],
                      [
                        "Contacted Leads",
                        contactedLeads,
                        "Contact has been made",
                        "amber",
                        "↗",
                      ],
                      [
                        "Admitted Leads",
                        admittedLeads,
                        "Converted to admission",
                        "green",
                        "✓",
                      ],
                      [
                        "Marketing Leads",
                        totalMarketingLeads,
                        "Leads created by Marketing",
                        "violet",
                        "♙",
                      ],
                    ].map(
                      ([label, value, description, color, icon]) => (
                        <div className="admin-stat-card" key={label}>
                          <div className="admin-stat-top">
                            <span>{label}</span>
                            <span className={`admin-stat-icon ${color}`}>
                              {icon}
                            </span>
                          </div>
                          <h3>{value}</h3>
                          <p>{description}</p>
                        </div>
                      )
                    )}
                  </div>

                  {marketingError && (
                    <p className="admin-message error">
                      Marketing Leads: {marketingError}
                    </p>
                  )}

                  <div className="admin-overview-lower">
                    <div className="admin-panel">
                      <div className="admin-panel-heading">
                        <div>
                          <h2>Follow-up Snapshot</h2>
                          <p>Items that need attention</p>
                        </div>
                        <button
                          className="admin-text-button"
                          onClick={() => selectSection("followups")}
                        >
                          View details →
                        </button>
                      </div>

                      <div className="admin-mini-stats">
                        <div>
                          <span className="admin-mini-icon amber">◷</span>
                          <span>
                            <small>Due today</small>
                            <strong>{followUpsDueToday}</strong>
                          </span>
                        </div>
                        <div>
                          <span className="admin-mini-icon red">!</span>
                          <span>
                            <small>Overdue</small>
                            <strong>{overdueFollowUps}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="admin-panel">
                      <div className="admin-panel-heading">
                        <div>
                          <h2>Admissions Summary</h2>
                          <p>Fee collection overview</p>
                        </div>
                        <button
                          className="admin-text-button"
                          onClick={() => selectSection("admissions")}
                        >
                          View details →
                        </button>
                      </div>

                      {admissionLoading ? (
                        <p className="admin-muted">
                          Loading admission reports...
                        </p>
                      ) : admissionError ? (
                        <p className="admin-message error">
                          {admissionError}
                        </p>
                      ) : (
                        <div className="admin-fee-summary">
                          <div>
                            <span>Total admissions</span>
                            <strong>{totalAdmissions}</strong>
                          </div>
                          <div>
                            <span>Fees collected</span>
                            <strong>
                              {formatCurrency(totalFeesCollected)}
                            </strong>
                          </div>
                          <div>
                            <span>Pending fees</span>
                            <strong>{formatCurrency(pendingFees)}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="admin-panel admin-quick-actions">
                    <div>
                      <h2>Quick actions</h2>
                      <p>Move your workflow forward.</p>
                    </div>
                    <button
                      className="admin-button"
                      onClick={() => selectSection("add-lead")}
                    >
                      + Add a new lead
                    </button>
                    <button
                      className="admin-button admin-button-light"
                      onClick={() => selectSection("leads")}
                    >
                      Manage leads
                    </button>
                    <button
                      className="admin-button admin-button-light"
                      onClick={() => selectSection("marketing-leads")}
                    >
                      View Marketing Leads
                    </button>
                    <button
                      className="admin-button admin-button-light"
                      onClick={() => selectSection("demos")}
                    >
                      Review demos
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          {activeSection === "followups" && (
            <section className="admin-view admin-animate">
              <div className="admin-section-heading">
                <div>
                  <h2>Follow-up Reports</h2>
                  <p>Track today's and overdue follow-ups.</p>
                </div>
              </div>

              {loading ? (
                <p className="admin-muted">
                  Loading follow-up information...
                </p>
              ) : (
                <div className="admin-stat-grid admin-stat-grid-two">
                  <div className="admin-stat-card">
                    <div className="admin-stat-top">
                      <span>Follow-ups Due Today</span>
                      <span className="admin-stat-icon amber">◷</span>
                    </div>
                    <h3>{followUpsDueToday}</h3>
                    <p>Follow-ups scheduled for today</p>
                  </div>

                  <div className="admin-stat-card">
                    <div className="admin-stat-top">
                      <span>Overdue Follow-ups</span>
                      <span className="admin-stat-icon red">!</span>
                    </div>
                    <h3>{overdueFollowUps}</h3>
                    <p>Past follow-ups not yet admitted</p>
                  </div>
                </div>
              )}

              <div className="admin-panel admin-table-panel">
                <div className="admin-panel-heading">
                  <div>
                    <h2>Follow-up Lead List</h2>
                    <p>Leads with a follow-up date</p>
                  </div>
                </div>

                {loading ? (
                  <p className="admin-muted">Loading leads...</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Phone</th>
                          <th>Course</th>
                          <th>Follow-up Date</th>
                          <th>Notes</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads
                          .filter(
                            (l) =>
                              l.followUpDate &&
                              String(l.status || "").toUpperCase() !==
                                "ADMITTED"
                          )
                          .sort((a, b) =>
                            String(a.followUpDate).localeCompare(
                              String(b.followUpDate)
                            )
                          )
                          .map((l) => (
                            <tr key={l.id}>
                              <td>{l.name || "-"}</td>
                              <td>{l.phone || "-"}</td>
                              <td>{l.interestedCourse || "-"}</td>
                              <td>{String(l.followUpDate).slice(0, 10)}</td>
                              <td>{l.followUpNotes || "-"}</td>
                              <td>
                                {String(l.status || "NEW").replaceAll(
                                  "_",
                                  " "
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeSection === "demos" && (
            <section className="admin-view admin-animate">
              <div className="admin-section-heading">
                <div>
                  <h2>Demo Class Reports</h2>
                  <p>Review scheduled and pending demo sessions.</p>
                </div>
              </div>

              {loading ? (
                <p className="admin-muted">Loading demo information...</p>
              ) : (
                <div className="admin-stat-grid admin-stat-grid-two">
                  <div className="admin-stat-card">
                    <div className="admin-stat-top">
                      <span>Upcoming / Pending Demos</span>
                      <span className="admin-stat-icon blue">▣</span>
                    </div>
                    <h3>{scheduledDemos}</h3>
                    <p>Demo sessions not completed or cancelled</p>
                  </div>
                </div>
              )}

              <div className="admin-panel admin-table-panel">
                <div className="admin-panel-heading">
                  <div>
                    <h2>Demo Schedule</h2>
                    <p>Leads with demo dates</p>
                  </div>
                </div>

                {loading ? (
                  <p className="admin-muted">Loading leads...</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Phone</th>
                          <th>Course</th>
                          <th>Demo Date</th>
                          <th>Demo Time</th>
                          <th>Demo Status</th>
                          <th>Lead Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads
                          .filter((l) => l.demoDate)
                          .sort((a, b) =>
                            String(a.demoDate).localeCompare(
                              String(b.demoDate)
                            )
                          )
                          .map((l) => (
                            <tr key={l.id}>
                              <td>{l.name || "-"}</td>
                              <td>{l.phone || "-"}</td>
                              <td>{l.interestedCourse || "-"}</td>
                              <td>{String(l.demoDate).slice(0, 10)}</td>
                              <td>{l.demoTime || "-"}</td>
                              <td>{l.demoStatus || "-"}</td>
                              <td>
                                {String(l.status || "NEW").replaceAll(
                                  "_",
                                  " "
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeSection === "admissions" && (
            <section className="admin-view admin-animate">
              <div className="admin-section-heading">
                <div>
                  <h2>Admissions and Fee Reports</h2>
                  <p>Admission totals and payment collection.</p>
                </div>
              </div>

              {admissionError && (
                <p className="admin-message error">{admissionError}</p>
              )}

              {admissionLoading ? (
                <p className="admin-muted">Loading admission reports...</p>
              ) : (
                !admissionError && (
                  <>
                    <div className="admin-stat-grid">
                      {[
                        [
                          "Total Admission Records",
                          totalAdmissions,
                          "Registered admissions",
                          "blue",
                        ],
                        [
                          "Total Course Fees",
                          formatCurrency(totalCourseFees),
                          "Total billed amount",
                          "violet",
                        ],
                        [
                          "Fees Collected",
                          formatCurrency(totalFeesCollected),
                          "Payments received",
                          "green",
                        ],
                        [
                          "Pending Fees",
                          formatCurrency(pendingFees),
                          "Balance to collect",
                          "amber",
                        ],
                      ].map(([label, value, description, color]) => (
                        <div className="admin-stat-card" key={label}>
                          <div className="admin-stat-top">
                            <span>{label}</span>
                            <span className={`admin-stat-icon ${color}`}>
                              ₹
                            </span>
                          </div>
                          <h3
                            className={
                              typeof value === "string" ? "admin-currency" : ""
                            }
                          >
                            {value}
                          </h3>
                          <p>{description}</p>
                        </div>
                      ))}
                    </div>

                    <div className="admin-panel admin-table-panel">
                      <div className="admin-panel-heading">
                        <div>
                          <h2>Recent Admissions</h2>
                          <p>Latest 10 admission records</p>
                        </div>
                      </div>

                      {admissions.length === 0 ? (
                        <p className="admin-muted">
                          No admission records found.
                        </p>
                      ) : (
                        <div className="admin-table-wrapper">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Student Name</th>
                                <th>Course</th>
                                <th>Total Fees</th>
                                <th>Paid Fees</th>
                                <th>Pending Fees</th>
                                <th>Payment Status</th>
                                <th>Admission Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...admissions]
                                .sort(
                                  (a, b) =>
                                    Number(b.id || 0) - Number(a.id || 0)
                                )
                                .slice(0, 10)
                                .map((a) => {
                                  const total = Number(a.totalFees) || 0;
                                  const paid = Number(a.paidFees) || 0;

                                  return (
                                    <tr key={a.id}>
                                      <td>{a.id}</td>
                                      <td>{a.studentName || "-"}</td>
                                      <td>{a.courseName || "-"}</td>
                                      <td>{formatCurrency(total)}</td>
                                      <td>{formatCurrency(paid)}</td>
                                      <td>
                                        {formatCurrency(
                                          Math.max(total - paid, 0)
                                        )}
                                      </td>
                                      <td>{a.paymentStatus || "-"}</td>
                                      <td>{a.admissionDate || "-"}</td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )
              )}
            </section>
          )}

          {activeSection === "marketing-leads" && (
            <section className="admin-view admin-animate">
              <div className="admin-section-heading">
                <div>
                  <h2>Marketing Leads</h2>
                  <p>
                    Track leads created by the Marketing team separately from
                    normal enquiries.
                  </p>
                </div>
                <span className="admin-live-pill">
                  <span />
                  {totalMarketingLeads} Marketing Leads
                </span>
              </div>

              <div className="admin-panel admin-table-panel">
                {marketingLoading ? (
                  <p className="admin-muted">Loading Marketing leads...</p>
                ) : marketingError ? (
                  <p className="admin-message error">{marketingError}</p>
                ) : marketingLeads.length === 0 ? (
                  <p className="admin-muted">No Marketing leads found.</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Interested Course</th>
                          <th>Source</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marketingLeads.map((lead) => {
                          const status = String(lead.status || "NEW");

                          return (
                            <tr key={lead.id}>
                              <td>{lead.id}</td>
                              <td>{lead.name || "-"}</td>
                              <td>{lead.email || "-"}</td>
                              <td>{lead.phone || "-"}</td>
                              <td>{lead.interestedCourse || "-"}</td>
                              <td>{lead.source || "-"}</td>
                              <td>
                                <span
                                  className={`admin-status ${status.toLowerCase()}`}
                                >
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
              </div>
            </section>
          )}

          {activeSection === "add-lead" && (
            <section className="admin-view admin-animate">
              <div className="admin-section-heading">
                <div>
                  <h2>Add New Student Lead</h2>
                  <p>Save a new enquiry to the shared CRM system.</p>
                </div>
              </div>

              <div className="admin-panel admin-form-panel">
                <form onSubmit={handleCreateLead}>
                  <div className="admin-form-grid">
                    <div className="admin-form-field">
                      <label htmlFor="adminLeadName">Student Name</label>
                      <input
                        id="adminLeadName"
                        type="text"
                        placeholder="Enter student name"
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="admin-form-field">
                      <label htmlFor="adminLeadEmail">Email</label>
                      <input
                        id="adminLeadEmail"
                        type="email"
                        placeholder="Enter student email"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="admin-form-field">
                      <label htmlFor="adminLeadPhone">Phone</label>
                      <input
                        id="adminLeadPhone"
                        type="tel"
                        placeholder="Enter phone number"
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div className="admin-form-field">
                      <label htmlFor="adminLeadCourse">
                        Interested Course
                      </label>
                      <input
                        id="adminLeadCourse"
                        type="text"
                        placeholder="Example: Java Full Stack"
                        value={leadCourse}
                        onChange={(e) => setLeadCourse(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {leadMessage && (
                    <p className="admin-message success">{leadMessage}</p>
                  )}
                  {leadError && (
                    <p className="admin-message error">{leadError}</p>
                  )}

                  <div className="admin-form-actions">
                    <button
                      type="submit"
                      className="admin-button"
                      disabled={leadSaving}
                    >
                      {leadSaving ? "Saving Lead..." : "Save Lead"}
                    </button>

                    <button
                      type="button"
                      className="admin-button admin-button-light"
                      onClick={() => selectSection("overview")}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {activeSection === "create-hr" && (
            <section className="admin-view admin-animate">
              <div className="admin-section-heading">
                <div>
                  <h2>Create HR Account</h2>
                  <p>Create an account for the HR dashboard.</p>
                </div>
              </div>

              <div className="admin-panel admin-form-panel">
                <form onSubmit={handleCreateHR}>
                  <div className="admin-form-grid">
                    <div className="admin-form-field">
                      <label htmlFor="hrName">HR Name</label>
                      <input
                        id="hrName"
                        type="text"
                        placeholder="Enter HR name"
                        value={hrName}
                        onChange={(e) => setHrName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="admin-form-field">
                      <label htmlFor="hrEmail">HR Email</label>
                      <input
                        id="hrEmail"
                        type="email"
                        placeholder="Enter HR email"
                        value={hrEmail}
                        onChange={(e) => setHrEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="admin-form-field">
                      <label htmlFor="hrPassword">Temporary Password</label>
                      <input
                        id="hrPassword"
                        type="password"
                        placeholder="Enter password"
                        value={hrPassword}
                        onChange={(e) => setHrPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {hrMessage && (
                    <p className="admin-message success">{hrMessage}</p>
                  )}
                  {hrError && (
                    <p className="admin-message error">{hrError}</p>
                  )}

                  <div className="admin-form-actions">
                    <button
                      type="submit"
                      className="admin-button"
                      disabled={hrLoading}
                    >
                      {hrLoading ? "Creating..." : "Create HR"}
                    </button>

                    <button
                      type="button"
                      className="admin-button admin-button-light"
                      onClick={() => selectSection("overview")}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {activeSection === "create-marketing" && (
            <section className="admin-view admin-animate">
              <div className="admin-section-heading">
                <div>
                  <h2>Create Marketing Account</h2>
                  <p>Create login credentials for a Marketing team member.</p>
                </div>
              </div>

              <div className="admin-panel admin-form-panel">
                <form onSubmit={handleCreateMarketing}>
                  <div className="admin-form-grid">
                    <div className="admin-form-field">
                      <label htmlFor="marketingName">
                        Marketing User Name
                      </label>
                      <input
                        id="marketingName"
                        type="text"
                        placeholder="Enter full name"
                        value={marketingName}
                        onChange={(e) => setMarketingName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="admin-form-field">
                      <label htmlFor="marketingEmail">Email Address</label>
                      <input
                        id="marketingEmail"
                        type="email"
                        placeholder="Enter email address"
                        value={marketingEmail}
                        onChange={(e) => setMarketingEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="admin-form-field">
                      <label htmlFor="marketingPassword">
                        Login Password
                      </label>
                      <input
                        id="marketingPassword"
                        type="password"
                        placeholder="Create a password (minimum 8 characters)"
                        value={marketingPassword}
                        onChange={(e) => setMarketingPassword(e.target.value)}
                        minLength={8}
                        required
                      />
                    </div>
                  </div>

                  {marketingMessage && (
                    <p className="admin-message success">
                      {marketingMessage}
                    </p>
                  )}
                  {marketingAccountError && (
                    <p className="admin-message error">
                      {marketingAccountError}
                    </p>
                  )}

                  <div className="admin-form-actions">
                    <button
                      type="submit"
                      className="admin-button"
                      disabled={marketingAccountLoading}
                    >
                      {marketingAccountLoading
                        ? "Creating..."
                        : "Create Marketing Account"}
                    </button>

                    <button
                      type="button"
                      className="admin-button admin-button-light"
                      onClick={() => selectSection("overview")}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {activeSection === "leads" && (
            <section className="admin-view admin-animate">
              <div className="admin-section-heading">
                <div>
                  <h2>Lead Management - Search &amp; Filters</h2>
                  <p>Search, filter, edit and delete leads.</p>
                </div>
              </div>

              <div className="admin-panel admin-leads-panel">
                {editMessage && (
                  <p className="admin-message success">{editMessage}</p>
                )}
                {deleteMessage && (
                  <p className="admin-message success">{deleteMessage}</p>
                )}
                {deleteError && (
                  <p className="admin-message error">{deleteError}</p>
                )}

                {editingLead && (
                  <div className="admin-edit-panel">
                    <h2>Edit Lead #{editingLead.id}</h2>

                    <form onSubmit={handleUpdateLead}>
                      <div className="admin-form-grid">
                        <div className="admin-form-field">
                          <label htmlFor="editLeadName">Student Name</label>
                          <input
                            id="editLeadName"
                            value={editLeadForm.name}
                            onChange={(e) =>
                              setEditLeadForm((p) => ({
                                ...p,
                                name: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        <div className="admin-form-field">
                          <label htmlFor="editLeadEmail">Email</label>
                          <input
                            id="editLeadEmail"
                            type="email"
                            value={editLeadForm.email}
                            onChange={(e) =>
                              setEditLeadForm((p) => ({
                                ...p,
                                email: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        <div className="admin-form-field">
                          <label htmlFor="editLeadPhone">Phone</label>
                          <input
                            id="editLeadPhone"
                            value={editLeadForm.phone}
                            onChange={(e) =>
                              setEditLeadForm((p) => ({
                                ...p,
                                phone: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        <div className="admin-form-field">
                          <label htmlFor="editLeadCourse">
                            Interested Course
                          </label>
                          <input
                            id="editLeadCourse"
                            value={editLeadForm.interestedCourse}
                            onChange={(e) =>
                              setEditLeadForm((p) => ({
                                ...p,
                                interestedCourse: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        <div className="admin-form-field">
                          <label htmlFor="editLeadStatus">Status</label>
                          <select
                            id="editLeadStatus"
                            value={editLeadForm.status}
                            onChange={(e) =>
                              setEditLeadForm((p) => ({
                                ...p,
                                status: e.target.value,
                              }))
                            }
                          >
                            {statusOptions.map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {editError && (
                        <p className="admin-message error">{editError}</p>
                      )}

                      <div className="admin-form-actions">
                        <button
                          type="submit"
                          className="admin-button"
                          disabled={editSaving}
                        >
                          {editSaving ? "Saving Changes..." : "Save Changes"}
                        </button>

                        <button
                          type="button"
                          className="admin-button admin-button-light"
                          onClick={handleCancelEditLead}
                          disabled={editSaving}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {loading ? (
                  <p className="admin-muted">Loading leads...</p>
                ) : error ? (
                  <p className="admin-muted">
                    Leads could not be displayed. Check the backend connection.
                  </p>
                ) : leads.length === 0 ? (
                  <p className="admin-muted">No leads found.</p>
                ) : (
                  <>
                    <div className="admin-form-grid admin-filter-grid">
                      <div className="admin-form-field">
                        <label htmlFor="leadSearch">
                          Search by name, email, or phone
                        </label>
                        <input
                          id="leadSearch"
                          type="search"
                          placeholder="Type a name, email, or phone number"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>

                      <div className="admin-form-field">
                        <label htmlFor="courseFilter">Filter by course</label>
                        <select
                          id="courseFilter"
                          value={courseFilter}
                          onChange={(e) => setCourseFilter(e.target.value)}
                        >
                          <option value="ALL">All Courses</option>
                          {availableCourses.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="admin-form-field">
                        <label htmlFor="statusFilter">Filter by status</label>
                        <select
                          id="statusFilter"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="ALL">All Statuses</option>
                          {statusOptions.map(([v, l]) => (
                            <option key={v} value={v}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="admin-filter-summary">
                      <span>
                        Showing {filteredLeads.length} of {leads.length} leads
                      </span>
                      <button
                        type="button"
                        className="admin-text-button"
                        onClick={resetLeadFilters}
                      >
                        Reset Filters
                      </button>
                    </div>

                    {filteredLeads.length === 0 ? (
                      <p className="admin-muted">
                        No leads match your search or selected filters.
                      </p>
                    ) : (
                      renderLeadTable(filteredLeads, true)
                    )}
                  </>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
