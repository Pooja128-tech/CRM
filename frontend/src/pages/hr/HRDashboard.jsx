import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../api";
import "../../App.css";
import "./HRDashboard.css";

// Automatically include the login session cookie in every API request.
const apiFetch = (url, options = {}) => {
  return fetch(url, {
    ...options,
    credentials: "include",
  });
};

// Read a useful error message from a failed response.
// Handles JSON ({ message } / { error }), plain text, and empty bodies.
const readErrorMessage = async (response, fallback) => {
  let text = "";

  try {
    text = await response.text();
  } catch (err) {
    text = "";
  }

  let message = "";

  if (text && !text.trim().startsWith("<")) {
    try {
      const body = JSON.parse(text);

      message =
        typeof body === "string"
          ? body
          : body?.message || body?.error || "";
    } catch (err) {
      message = text;
    }
  }

  message = String(message || "").trim();

  if (message.length > 300) {
    message = `${message.slice(0, 300)}…`;
  }

  if (message) {
    return message;
  }

  switch (response.status) {
    case 400:
      return "The details were rejected. Please check the form and try again.";
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The enquiry was not found.";
    case 500:
      return "The server reported an error. Please try again.";
    default:
      return fallback;
  }
};

const normalizeTime = (value) => (value ? String(value).slice(0, 5) : "");

// Convert a backend activity record into the shape used by the screen.
const normalizeActivity = (activity) => ({
  id: activity.id ?? null,
  leadId: activity.leadId ?? activity.lead?.id ?? null,
  followUpDate: activity.followUpDate || "",
  followUpNotes: activity.followUpNotes || "",
  demoDate: activity.demoDate || "",
  demoTime: normalizeTime(activity.demoTime),
  demoStatus: String(activity.demoStatus || "").toUpperCase(),
  demoMode: String(activity.demoMode || "").toUpperCase(),
  // Kept only so older records still load; no longer shown or edited.
  demoLocation: activity.demoLocation || "",
  trainerName: activity.trainerName || "",
  demoMeetingLink: activity.demoMeetingLink || "",
});

/* ------------------------------------------------------------------ */
/* Presentation-only helpers (no data or API logic lives here)         */
/* ------------------------------------------------------------------ */

const ICON_PATHS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  enquiries: (
    <>
      <path d="M3 13l2.5-7.5A2 2 0 0 1 7.4 4h9.2a2 2 0 0 1 1.9 1.5L21 13" />
      <path d="M3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5h-5l-1.5 2h-5L8 13z" />
    </>
  ),
  marketing: (
    <>
      <path d="M3 11v3a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" />
      <path d="M15 9a4 4 0 0 1 0 6" />
      <path d="M18 6a8 8 0 0 1 0 12" />
    </>
  ),
  followup: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  demo: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  admission: (
    <>
      <path d="M2 9l10-5 10 5-10 5z" />
      <path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12l4 4 10-10" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  spark: <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" />
    </>
  ),
  calendarCheck: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 13l2.5-7.5A2 2 0 0 1 7.4 4h9.2a2 2 0 0 1 1.9 1.5L21 13" />
      <path d="M3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5h-5l-1.5 2h-5L8 13z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
};

function Icon({ name, size = 18 }) {
  return (
    <svg
      className="hrd-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

function Spin() {
  return <span className="hrd-spinner" aria-hidden="true" />;
}

// Success / error message with an icon, so meaning is not colour-only.
function Feedback({ ok, text, compact = false }) {
  if (!text) {
    return null;
  }

  return (
    <p
      role="status"
      className={`hrd-msg ${ok ? "is-success" : "is-error"} ${
        compact ? "is-compact" : ""
      }`}
    >
      <Icon name={ok ? "check" : "alert"} size={compact ? 14 : 16} />
      <span>{text}</span>
    </p>
  );
}

// Lead status badge. The text is always shown, never colour alone.
function StatusBadge({ status }) {
  const label = String(status || "NEW");
  const tone = label.toLowerCase().replaceAll(" ", "-");

  return (
    <span className={`hrd-badge hrd-badge--${tone}`}>
      <span className="hrd-badge-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

function DemoBadge({ status }) {
  if (!status) {
    return null;
  }

  const label = status.charAt(0) + status.slice(1).toLowerCase();

  return (
    <span className={`hrd-badge hrd-badge--demo-${status.toLowerCase()}`}>
      <span className="hrd-badge-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

// Due-today / overdue / upcoming indicator for a follow-up date.
function FollowUpTag({ date, today }) {
  if (!date) {
    return null;
  }

  if (date < today) {
    return (
      <span className="hrd-tag hrd-tag--overdue">
        <Icon name="alert" size={12} /> Overdue
      </span>
    );
  }

  if (date === today) {
    return (
      <span className="hrd-tag hrd-tag--today">
        <Icon name="followup" size={12} /> Due today
      </span>
    );
  }

  return (
    <span className="hrd-tag hrd-tag--upcoming">
      <Icon name="calendarCheck" size={12} /> Upcoming
    </span>
  );
}

function TableSkeleton({ label }) {
  return (
    <div className="hrd-skeleton" role="status" aria-label={label}>
      <span className="hrd-skeleton-row" />
      <span className="hrd-skeleton-row" />
      <span className="hrd-skeleton-row" />
      <span className="hrd-skeleton-row" />
    </div>
  );
}

function EmptyRow({ colSpan, title, hint }) {
  return (
    <tr>
      <td colSpan={colSpan} className="hrd-empty-cell">
        <div className="hrd-empty">
          <Icon name="inbox" size={26} />
          <strong>{title}</strong>
          {hint && <span>{hint}</span>}
        </div>
      </td>
    </tr>
  );
}

const STATUS_OPTIONS = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "NOT INTERESTED",
  "FOLLOW UP",
  "DEMO SCHEDULED",
  "ADMITTED",
];

const SECTION_TITLES = {
  dashboard: "HR Dashboard",
  leads: "Lead Management",
  marketing: "Marketing Leads",
  followups: "Follow-up Management",
  demos: "Demo Class Management",
  admissions: "Admissions Management",
};

function HRDashboard() {
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [marketingLeads, setMarketingLeads] = useState([]);
  const [marketingLoading, setMarketingLoading] = useState(true);
  const [marketingError, setMarketingError] = useState("");

  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [followUpFilter, setFollowUpFilter] = useState("ALL");
  const [demoFilter, setDemoFilter] = useState("ALL");

  // UI-only: mobile sidebar drawer
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Add Enquiry form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    interestedCourse: "",
  });
  const [addMessage, setAddMessage] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);
  const [addingLead, setAddingLead] = useState(false);

  // Status update states
  const [updatingLeadId, setUpdatingLeadId] = useState(null);
  const [statusMessages, setStatusMessages] = useState({});
  const [statusErrors, setStatusErrors] = useState({});

  // Saved HR activity records for the logged-in HR employee, keyed by leadId.
  // The backend returns only this HR employee's records.
  const [activities, setActivities] = useState({});
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);
  const [activitiesError, setActivitiesError] = useState("");

  // Follow-up states.
  // followUpForms holds ONLY unsaved edits, keyed by leadId. Saved values
  // come from `activities`, so loading never overwrites what the user typed.
  const [followUpForms, setFollowUpForms] = useState({});
  const [savingFollowUpId, setSavingFollowUpId] = useState(null);
  const [followUpMessages, setFollowUpMessages] = useState({});
  const [followUpErrors, setFollowUpErrors] = useState({});

  // Demo class states (same idea: demoForms holds only unsaved edits)
  const [demoForms, setDemoForms] = useState({});
  const [savingDemoId, setSavingDemoId] = useState(null);
  const [demoMessages, setDemoMessages] = useState({});
  const [demoErrors, setDemoErrors] = useState({});

  // Admission management states
  const [admissions, setAdmissions] = useState([]);
  const [admissionLoading, setAdmissionLoading] = useState(true);
  const [admissionError, setAdmissionError] = useState("");
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);
  const [admissionForm, setAdmissionForm] = useState({
    leadId: "",
    admissionDate: "",
    totalFees: "",
    paidFees: "0",
  });
  const [savingAdmission, setSavingAdmission] = useState(false);
  const [admissionMessage, setAdmissionMessage] = useState("");
  const [admissionSuccess, setAdmissionSuccess] = useState(false);

  const user = JSON.parse(localStorage.getItem("crmUser") || "null");

  // Today's date in local YYYY-MM-DD format
  const today = (() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  // Load this HR employee's saved activities (follow-ups and demos).
  // Returns the new activity map, or null if loading failed.
  const loadActivities = useCallback(async () => {
    try {
      setActivitiesLoading(true);
      setActivitiesError("");

      const response = await apiFetch(`${API_URL}/hr-activities`);

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
            "Unable to load your follow-up and demo records."
          )
        );
      }

      const data = await response.json();

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.activities)
          ? data.activities
          : Array.isArray(data?.content)
            ? data.content
            : [];

      const map = {};

      list.forEach((item) => {
        if (!item) {
          return;
        }

        const activity = normalizeActivity(item);

        if (activity.leadId == null) {
          return;
        }

        const key = Number(activity.leadId);
        const existing = map[key];

        // One record per lead is expected; if there are more, keep the newest.
        if (!existing || Number(activity.id || 0) >= Number(existing.id || 0)) {
          map[key] = activity;
        }
      });

      setActivities(map);
      setActivitiesLoaded(true);

      return map;
    } catch (err) {
      setActivitiesError(
        err.message || "Unable to load your follow-up and demo records."
      );
      return null;
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  // Follow-up values for a lead: unsaved edits win, then the saved activity.
  // Lead-record fields are intentionally NOT used (they are shared by all HR).
  const getFollowUpValues = (leadId) => {
    const saved = activities[leadId] || {};
    const edit = followUpForms[leadId] || {};

    return {
      followUpDate: edit.followUpDate ?? saved.followUpDate ?? "",
      followUpNotes: edit.followUpNotes ?? saved.followUpNotes ?? "",
    };
  };

  const getDemoValues = (leadId) => {
    const saved = activities[leadId] || {};
    const edit = demoForms[leadId] || {};

    return {
      demoDate: edit.demoDate ?? saved.demoDate ?? "",
      demoTime: edit.demoTime ?? saved.demoTime ?? "",
      demoStatus: edit.demoStatus ?? saved.demoStatus ?? "",
      demoMode: edit.demoMode ?? saved.demoMode ?? "",
      trainerName: edit.trainerName ?? saved.trainerName ?? "",
      demoMeetingLink: edit.demoMeetingLink ?? saved.demoMeetingLink ?? "",
    };
  };

  // Normalize demo status
  const getDemoStatus = (lead) => {
    const leadId = lead.id ?? lead.leadId;
    return String(getDemoValues(leadId).demoStatus || "").toUpperCase();
  };

  // Load HR enquiries separately
  useEffect(() => {
    if (!user || user.role !== "HR") {
      navigate("/");
      return;
    }

    const fetchLeads = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiFetch(
          `${API_URL}/leads/hr-enquiries`
        );

        if (!response.ok) {
          throw new Error("Unable to load enquiries.");
        }

        const data = await response.json();

        const leadList = Array.isArray(data)
          ? data
          : Array.isArray(data.leads)
            ? data.leads
            : [];

        setLeads(leadList);
      } catch (err) {
        setError(err.message || "Unable to load enquiries.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [navigate, user?.role]);

  // Load Marketing leads independently
  useEffect(() => {
    if (!user || user.role !== "HR") {
      return;
    }

    const fetchMarketingLeads = async () => {
      try {
        setMarketingLoading(true);
        setMarketingError("");

        const response = await apiFetch(
          `${API_URL}/leads/marketing-leads`
        );

        if (!response.ok) {
          throw new Error("Unable to load Marketing leads.");
        }

        const data = await response.json();

        const leadList = Array.isArray(data)
          ? data
          : Array.isArray(data.leads)
            ? data.leads
            : [];

        setMarketingLeads(leadList);
      } catch (err) {
        setMarketingError(
          err.message || "Unable to load Marketing leads."
        );
      } finally {
        setMarketingLoading(false);
      }
    };

    fetchMarketingLeads();
  }, [navigate, user?.role]);

  // Load this HR employee's saved follow-ups and demos
  useEffect(() => {
    if (!user || user.role !== "HR") {
      return;
    }

    loadActivities();
  }, [user?.role, loadActivities]);

  // Load saved admissions independently from enquiries
  useEffect(() => {
    if (!user || user.role !== "HR") {
      return;
    }

    const fetchAdmissions = async () => {
      try {
        setAdmissionLoading(true);
        setAdmissionError("");

        const response = await apiFetch(`${API_URL}/admissions`);

        if (!response.ok) {
          throw new Error("Unable to load admissions.");
        }

        const data = await response.json();
        setAdmissions(Array.isArray(data) ? data : []);
      } catch (err) {
        setAdmissionError(err.message || "Unable to load admissions.");
      } finally {
        setAdmissionLoading(false);
      }
    };

    fetchAdmissions();
  }, [navigate, user?.role]);

  // UI-only: close the mobile drawer with the Escape key
  useEffect(() => {
    if (!sidebarOpen) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  // Create a new HR enquiry
  const handleAddEnquiry = async (event) => {
    event.preventDefault();

    setAddMessage("");
    setAddSuccess(false);
    setAddingLead(true);

    try {
      const response = await apiFetch(`${API_URL}/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newLead.name.trim(),
          email: newLead.email.trim(),
          phone: newLead.phone.trim(),
          interestedCourse: newLead.interestedCourse.trim(),
          status: "NEW",
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create enquiry. Please try again.");
      }

      const createdLead = await response.json();

      setLeads((previousLeads) => [createdLead, ...previousLeads]);

      setNewLead({
        name: "",
        email: "",
        phone: "",
        interestedCourse: "",
      });

      setStatusFilter("ALL");
      setFollowUpFilter("ALL");
      setDemoFilter("ALL");
      setSearch("");
      setAddSuccess(true);
      setAddMessage("Enquiry created successfully!");
    } catch (err) {
      setAddSuccess(false);
      setAddMessage(err.message || "Unable to create enquiry.");
    } finally {
      setAddingLead(false);
    }
  };

  // Normalize enquiry status for display and filtering
  const getStatus = (lead) =>
    String(lead.status || "NEW").toUpperCase().replaceAll("_", " ");

  // Payload for Lead updates (status changes, admissions).
  // It re-sends the lead's OWN stored values, never the HR activity forms,
  // so a Lead update cannot leak one HR employee's follow-up or demo data
  // into the shared Lead record.
  const createLeadPayload = (lead, overrides = {}) => {
    return {
      name: lead.name || lead.fullName || "",
      email: lead.email || "",
      phone: lead.phone || "",
      interestedCourse: lead.interestedCourse || lead.course || "",
      status: String(lead.status || "NEW").toUpperCase().replaceAll(" ", "_"),

      followUpDate: lead.followUpDate ?? null,
      followUpNotes: lead.followUpNotes ?? "",

      demoDate: lead.demoDate || null,
      demoTime: lead.demoTime || null,
      demoStatus: lead.demoStatus || null,

      ...overrides,
    };
  };

  // Put an updated lead into the correct list.
  // listType is "hr" (HR Enquiries) or "marketing" (Marketing Leads).
  // Only the lead with the matching ID is changed; every other lead is kept.
  // If the same lead also appears in the other list, it is kept in sync.
  const applyUpdatedLead = (listType, leadId, updatedLead) => {
    const matches = (item) =>
      Number(item.id ?? item.leadId) === Number(leadId);

    const replaceLead = (list) =>
      list.map((item) => (matches(item) ? updatedLead : item));

    // Merge keeps fields (such as "source") that the update response may omit
    const mergeLead = (list) =>
      list.map((item) =>
        matches(item) ? { ...item, ...updatedLead } : item
      );

    if (listType === "marketing") {
      setMarketingLeads(mergeLead);
      setLeads(mergeLead);
    } else {
      setLeads(replaceLead);
      setMarketingLeads(mergeLead);
    }
  };

  // Update enquiry status (listType: "hr" by default, or "marketing")
  // This still uses PUT /leads/{id}. It is NOT an HR activity.
  const handleStatusChange = async (lead, newStatus, listType = "hr") => {
    const leadId = lead.id ?? lead.leadId;
    const previousStatus = getStatus(lead);

    if (leadId == null || newStatus === previousStatus) {
      return;
    }

    setUpdatingLeadId(leadId);

    setStatusMessages((previous) => ({
      ...previous,
      [leadId]: "",
    }));

    setStatusErrors((previous) => ({
      ...previous,
      [leadId]: false,
    }));

    try {
      const response = await apiFetch(`${API_URL}/leads/${leadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          createLeadPayload(lead, {
            status: newStatus.replaceAll(" ", "_"),
          })
        ),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "Enquiry not found."
            : "Unable to update status. Please try again."
        );
      }

      const updatedLead = await response.json();

      applyUpdatedLead(listType, leadId, updatedLead);

      setStatusMessages((previous) => ({
        ...previous,
        [leadId]: "Status saved successfully!",
      }));
    } catch (err) {
      setStatusMessages((previous) => ({
        ...previous,
        [leadId]: err.message || "Status update failed.",
      }));

      setStatusErrors((previous) => ({
        ...previous,
        [leadId]: true,
      }));
    } finally {
      setUpdatingLeadId(null);
    }
  };

  // Store the activity returned by POST /hr-activities.
  // If the response has no usable record, reload from the backend instead.
  const applySavedActivity = async (leadId, response) => {
    let saved = null;

    try {
      saved = await response.json();
    } catch (err) {
      saved = null;
    }

    if (saved && (saved.leadId ?? saved.lead?.id) != null) {
      setActivities((previous) => ({
        ...previous,
        [Number(leadId)]: normalizeActivity(saved),
      }));
    } else {
      await loadActivities();
    }
  };

  // Remove the unsaved edits for one lead
  const clearEdits = (setter, leadId) => {
    setter((previous) => {
      const next = { ...previous };
      delete next[leadId];
      return next;
    });
  };

  // Change follow-up date or notes locally (unsaved edit)
  const handleFollowUpChange = (leadId, field, value) => {
    setFollowUpForms((previous) => ({
      ...previous,
      [leadId]: {
        ...(previous[leadId] || {}),
        [field]: value,
      },
    }));

    setFollowUpMessages((previous) => ({
      ...previous,
      [leadId]: "",
    }));

    setFollowUpErrors((previous) => ({
      ...previous,
      [leadId]: false,
    }));
  };

  const showFollowUpError = (leadId, message) => {
    setFollowUpMessages((previous) => ({
      ...previous,
      [leadId]: message,
    }));

    setFollowUpErrors((previous) => ({
      ...previous,
      [leadId]: true,
    }));
  };

  // Save follow-up date and notes through POST /hr-activities.
  // Only follow-up fields are sent, so demo fields are not touched here.
  const handleSaveFollowUp = async (lead) => {
    const leadId = lead.id ?? lead.leadId;

    if (leadId == null) {
      return;
    }

    if (!activitiesLoaded) {
      showFollowUpError(
        leadId,
        "Your saved records are still loading. Please wait and try again."
      );
      return;
    }

    const form = getFollowUpValues(leadId);

    if (form.followUpDate && form.followUpDate < today) {
      showFollowUpError(leadId, "Please select today or a future date.");
      return;
    }

    setSavingFollowUpId(leadId);

    setFollowUpMessages((previous) => ({
      ...previous,
      [leadId]: "",
    }));

    setFollowUpErrors((previous) => ({
      ...previous,
      [leadId]: false,
    }));

    try {
      const response = await apiFetch(`${API_URL}/hr-activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId: Number(leadId),
          followUpDate: form.followUpDate || null,
          followUpNotes: (form.followUpNotes || "").trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
            "Unable to save follow-up. Please try again."
          )
        );
      }

      await applySavedActivity(leadId, response);
      clearEdits(setFollowUpForms, leadId);

      setFollowUpMessages((previous) => ({
        ...previous,
        [leadId]: "Follow-up saved successfully!",
      }));
    } catch (err) {
      showFollowUpError(
        leadId,
        err.message || "Unable to save follow-up."
      );
    } finally {
      setSavingFollowUpId(null);
    }
  };

  // Change demo details locally (unsaved edit)
  const handleDemoChange = (leadId, field, value) => {
    setDemoForms((previous) => ({
      ...previous,
      [leadId]: {
        ...(previous[leadId] || {}),
        [field]: value,
      },
    }));

    setDemoMessages((previous) => ({
      ...previous,
      [leadId]: "",
    }));

    setDemoErrors((previous) => ({
      ...previous,
      [leadId]: false,
    }));
  };

  const showDemoError = (leadId, message) => {
    setDemoMessages((previous) => ({
      ...previous,
      [leadId]: message,
    }));

    setDemoErrors((previous) => ({
      ...previous,
      [leadId]: true,
    }));
  };

  // Separate, deliberate Lead update: mark the lead as DEMO_SCHEDULED.
  // This is NOT part of saving the activity; the activity is already saved.
  // Returns true when no change was needed or the update succeeded.
  const syncDemoScheduledStatus = async (lead, listType) => {
    const leadId = lead.id ?? lead.leadId;
    const currentStatus = getStatus(lead);

    if (currentStatus === "DEMO SCHEDULED" || currentStatus === "ADMITTED") {
      return true;
    }

    try {
      const response = await apiFetch(`${API_URL}/leads/${leadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          createLeadPayload(lead, { status: "DEMO_SCHEDULED" })
        ),
      });

      if (!response.ok) {
        return false;
      }

      const updatedLead = await response.json();
      applyUpdatedLead(listType, leadId, updatedLead);

      return true;
    } catch (err) {
      return false;
    }
  };

  // Save demo class details through POST /hr-activities (listType is only
  // used for the separate lead-status update afterwards).
  // Only demo fields are sent, so follow-up fields are not touched here.
  const handleSaveDemo = async (lead, listType = "hr") => {
    const leadId = lead.id ?? lead.leadId;

    if (leadId == null) {
      return;
    }

    if (!activitiesLoaded) {
      showDemoError(
        leadId,
        "Your saved records are still loading. Please wait and try again."
      );
      return;
    }

    const form = getDemoValues(leadId);
    const meetingLink = (form.demoMeetingLink || "").trim();
    const trainerName = (form.trainerName || "").trim();

    if (form.demoStatus && (!form.demoDate || !form.demoTime)) {
      showDemoError(leadId, "Please select both a demo date and time.");
      return;
    }

    if (form.demoDate && !form.demoStatus) {
      showDemoError(leadId, "Please select a demo status.");
      return;
    }

    if (form.demoStatus === "SCHEDULED") {
      if (form.demoDate < today) {
        showDemoError(
          leadId,
          "A scheduled demo must be today or in the future."
        );
        return;
      }

      if (form.demoMode !== "ONLINE" && form.demoMode !== "OFFLINE") {
        showDemoError(
          leadId,
          "Please select a demo mode (Online or Offline)."
        );
        return;
      }

      if (form.demoMode === "ONLINE") {
        if (!meetingLink) {
          showDemoError(leadId, "Please enter the Google Meet link.");
          return;
        }

        if (!/^https?:\/\//i.test(meetingLink)) {
          showDemoError(
            leadId,
            "The Google Meet link must start with http:// or https://"
          );
          return;
        }
      }

      if (form.demoMode === "OFFLINE" && !trainerName) {
        showDemoError(leadId, "Please enter the trainer name.");
        return;
      }
    }

    const payload = {
      leadId: Number(leadId),
      demoDate: form.demoDate || null,
      demoTime: form.demoTime || null,
      demoStatus: form.demoStatus || null,
      demoMode: form.demoMode || null,
    };

    // Online sends only the Google Meet link; offline sends only the trainer
    // name. demoLocation is no longer sent for new submissions.
    if (form.demoMode === "ONLINE") {
      payload.demoMeetingLink = meetingLink;
      payload.trainerName = null;
    } else if (form.demoMode === "OFFLINE") {
      payload.trainerName = trainerName;
      payload.demoMeetingLink = null;
    }

    setSavingDemoId(leadId);

    setDemoMessages((previous) => ({
      ...previous,
      [leadId]: "",
    }));

    setDemoErrors((previous) => ({
      ...previous,
      [leadId]: false,
    }));

    try {
      const response = await apiFetch(`${API_URL}/hr-activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const backendMessage = await readErrorMessage(
          response,
          "Unable to save demo details. Please try again."
        );

        let message = backendMessage;

        // The backend may have saved the demo and then failed to send the
        // email. Reload to find out what is really stored.
        if (response.status >= 500) {
          const latest = await loadActivities();
          const record = latest ? latest[Number(leadId)] : null;

          const wasSaved =
            record &&
            record.demoDate === (payload.demoDate || "") &&
            record.demoTime === (payload.demoTime || "") &&
            record.demoStatus === (payload.demoStatus || "") &&
            record.demoMode === (payload.demoMode || "");

          if (wasSaved) {
            clearEdits(setDemoForms, leadId);

            message = `${backendMessage} Your demo details were saved.`;

            if (payload.demoStatus === "SCHEDULED") {
              const synced = await syncDemoScheduledStatus(lead, listType);

              if (!synced) {
                message +=
                  " The lead status could not be changed to DEMO SCHEDULED; please update it manually.";
              }
            }
          }
        }

        showDemoError(leadId, message);
        return;
      }

      await applySavedActivity(leadId, response);
      clearEdits(setDemoForms, leadId);

      let message =
        payload.demoStatus === "SCHEDULED"
          ? "Demo saved successfully and the confirmation email was sent."
          : "Demo details saved successfully!";

      if (payload.demoStatus === "SCHEDULED") {
        const synced = await syncDemoScheduledStatus(lead, listType);

        if (!synced) {
          message +=
            " However, the lead status could not be changed to DEMO SCHEDULED; please update it manually.";
        }
      }

      setDemoMessages((previous) => ({
        ...previous,
        [leadId]: message,
      }));
    } catch (err) {
      showDemoError(
        leadId,
        err.message || "Unable to save demo details."
      );
    } finally {
      setSavingDemoId(null);
    }
  };

  // Enquiries that do not yet have an admission record
  const leadsAvailableForAdmission = leads.filter((lead) => {
    const leadId = lead.id ?? lead.leadId;

    return (
      leadId != null &&
      !admissions.some(
        (admission) => Number(admission.leadId) === Number(leadId)
      )
    );
  });

  // Marketing leads that do not yet have an admission record.
  // A lead that is already listed in HR enquiries is skipped here so the
  // same person can never be selected (or admitted) twice.
  const marketingLeadsAvailableForAdmission = marketingLeads.filter(
    (lead) => {
      const leadId = lead.id ?? lead.leadId;

      return (
        leadId != null &&
        !admissions.some(
          (admission) => Number(admission.leadId) === Number(leadId)
        ) &&
        !leads.some(
          (hrLead) => Number(hrLead.id ?? hrLead.leadId) === Number(leadId)
        )
      );
    }
  );

  // Everyone who can be selected in the admission form
  const admissionCandidatesCount =
    leadsAvailableForAdmission.length +
    marketingLeadsAvailableForAdmission.length;

  // Create an admission for an existing enquiry or Marketing lead
  const handleCreateAdmission = async (event) => {
    event.preventDefault();
    setAdmissionMessage("");
    setAdmissionSuccess(false);

    // Look in HR enquiries first, then in Marketing leads
    const selectedHrLead = leads.find(
      (lead) =>
        Number(lead.id ?? lead.leadId) === Number(admissionForm.leadId)
    );

    const selectedMarketingLead = selectedHrLead
      ? null
      : marketingLeads.find(
          (lead) =>
            Number(lead.id ?? lead.leadId) === Number(admissionForm.leadId)
        );

    const selectedLead = selectedHrLead || selectedMarketingLead;
    const selectedListType = selectedHrLead ? "hr" : "marketing";

    if (!selectedLead) {
      setAdmissionMessage("Please select an enquiry.");
      return;
    }

    const leadId = selectedLead.id ?? selectedLead.leadId;

    if (
      admissions.some(
        (admission) => Number(admission.leadId) === Number(leadId)
      )
    ) {
      setAdmissionMessage("This enquiry already has an admission record.");
      return;
    }

    const totalFees = Number(admissionForm.totalFees);
    const paidFees = Number(admissionForm.paidFees);

    if (
      !admissionForm.admissionDate ||
      admissionForm.totalFees === "" ||
      admissionForm.paidFees === ""
    ) {
      setAdmissionMessage(
        "Please complete the admission date and fee fields."
      );
      return;
    }

    if (
      !Number.isFinite(totalFees) ||
      !Number.isFinite(paidFees) ||
      totalFees < 0 ||
      paidFees < 0 ||
      paidFees > totalFees
    ) {
      setAdmissionMessage(
        "Enter valid fees. Paid fees cannot exceed total fees."
      );
      return;
    }

    setSavingAdmission(true);

    try {
      const response = await apiFetch(`${API_URL}/admissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          studentName: selectedLead.name || selectedLead.fullName || "",
          courseName:
            selectedLead.interestedCourse || selectedLead.course || "",
          admissionDate: admissionForm.admissionDate,
          totalFees,
          paidFees,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          message || "Unable to save admission. Please try again."
        );
      }

      const savedAdmission = await response.json();

      setAdmissions((previous) => [savedAdmission, ...previous]);

      // Keep the lead status in sync with the new admission when possible.
      let statusSynced = false;

      try {
        const statusResponse = await apiFetch(
          `${API_URL}/leads/${leadId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              createLeadPayload(selectedLead, { status: "ADMITTED" })
            ),
          }
        );

        if (statusResponse.ok) {
          const updatedLead = await statusResponse.json();

          applyUpdatedLead(selectedListType, leadId, updatedLead);
          statusSynced = true;
        }
      } catch (statusErr) {
        console.warn(
          "Admission saved, but enquiry status could not be updated.",
          statusErr
        );
      }

      setAdmissionForm({
        leadId: "",
        admissionDate: "",
        totalFees: "",
        paidFees: "0",
      });

      setAdmissionMessage(
        statusSynced
          ? "Admission saved successfully!"
          : "Admission saved, but the lead status could not be changed to ADMITTED. Please update it manually."
      );
      setAdmissionSuccess(true);
      setShowAdmissionForm(false);
    } catch (err) {
      setAdmissionMessage(err.message || "Unable to save admission.");
      setAdmissionSuccess(false);
    } finally {
      setSavingAdmission(false);
    }
  };

  // Search and filter HR enquiries.
  // Follow-up and demo filters use unsaved edits first, then saved activity.
  const filteredLeads = leads.filter((lead) => {
    const text = search.toLowerCase();

    const matchesSearch = [
      lead.name,
      lead.fullName,
      lead.email,
      lead.phone,
      lead.course,
      lead.interestedCourse,
    ].some((value) =>
      String(value || "").toLowerCase().includes(text)
    );

    const matchesStatus =
      statusFilter === "ALL" || getStatus(lead) === statusFilter;

    const leadId = lead.id ?? lead.leadId;
    const followUpDate = getFollowUpValues(leadId).followUpDate;

    const matchesFollowUp =
      followUpFilter === "ALL" ||
      (followUpFilter === "SCHEDULED" && followUpDate !== "") ||
      (followUpFilter === "TODAY" && followUpDate === today) ||
      (followUpFilter === "OVERDUE" &&
        followUpDate !== "" &&
        followUpDate < today);

    const demoDate = getDemoValues(leadId).demoDate;
    const demoStatus = getDemoStatus(lead);

    const matchesDemo =
      demoFilter === "ALL" ||
      (demoFilter === "SCHEDULED" && demoStatus === "SCHEDULED") ||
      (demoFilter === "COMPLETED" && demoStatus === "COMPLETED") ||
      (demoFilter === "CANCELLED" && demoStatus === "CANCELLED") ||
      (demoFilter === "UPCOMING" &&
        demoStatus === "SCHEDULED" &&
        demoDate >= today);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesFollowUp &&
      matchesDemo
    );
  });

  // Dashboard counts
  const countStatus = (status) =>
    leads.filter((lead) => getStatus(lead) === status).length;

  // Follow-up and demo statistics come from this HR employee's SAVED
  // activity records. There is one record per lead, so no lead is counted
  // twice. Records for leads that are not on screen are ignored.
  const knownLeadIds = new Set(
    [...leads, ...marketingLeads]
      .map((lead) => Number(lead.id ?? lead.leadId))
      .filter((id) => Number.isFinite(id))
  );

  const savedActivities = Object.values(activities).filter((activity) =>
    knownLeadIds.has(Number(activity.leadId))
  );

  const scheduledFollowUps = savedActivities.filter(
    (activity) => activity.followUpDate !== ""
  ).length;

  const followUpsDueToday = savedActivities.filter(
    (activity) => activity.followUpDate === today
  ).length;

  const overdueFollowUps = savedActivities.filter(
    (activity) =>
      activity.followUpDate !== "" && activity.followUpDate < today
  ).length;

  const scheduledDemos = savedActivities.filter(
    (activity) => activity.demoStatus === "SCHEDULED"
  ).length;

  const completedDemos = savedActivities.filter(
    (activity) => activity.demoStatus === "COMPLETED"
  ).length;

  // Inputs stay disabled until the saved activities have loaded, so a
  // missing record is never mistaken for a saved empty value.
  const controlsDisabled = (leadId) => leadId == null || !activitiesLoaded;

  const renderActivityStatus = () => (
    <>
      {activitiesLoading && !activitiesLoaded && (
        <p className="hrd-hint" role="status">
          <Spin /> Loading your follow-up and demo records...
        </p>
      )}

      {activitiesError && (
        <div className="hrd-alert" role="alert">
          <Icon name="alert" size={16} />
          <span>{activitiesError}</span>
          <button
            type="button"
            className="primary-button hrd-btn-sm"
            onClick={() => loadActivities()}
          >
            Retry
          </button>
        </div>
      )}
    </>
  );

  // Demo mode drop-down (Online / Offline)
  const renderDemoModeSelect = (leadId, name, form) => (
    <select
      aria-label={`Demo mode for ${name}`}
      value={form.demoMode}
      disabled={controlsDisabled(leadId)}
      onChange={(event) =>
        handleDemoChange(leadId, "demoMode", event.target.value)
      }
      className="hrd-select"
    >
      <option value="">Select mode</option>
      <option value="ONLINE">Online</option>
      <option value="OFFLINE">Offline</option>
    </select>
  );

  // Google Meet link (online) or trainer name (offline)
  const renderDemoDetailInput = (leadId, name, form) => {
    if (form.demoMode === "ONLINE") {
      return (
        <div className="hrd-detail hrd-detail--online">
          <span className="hrd-detail-label">
            <Icon name="globe" size={13} /> Google Meet link
          </span>
          <input
            type="url"
            aria-label={`Google Meet link for ${name}`}
            placeholder="Google Meet link (https://...)"
            value={form.demoMeetingLink}
            disabled={controlsDisabled(leadId)}
            onChange={(event) =>
              handleDemoChange(leadId, "demoMeetingLink", event.target.value)
            }
            className="hrd-input"
          />
        </div>
      );
    }

    if (form.demoMode === "OFFLINE") {
      return (
        <div className="hrd-detail hrd-detail--offline">
          <span className="hrd-detail-label">
            <Icon name="users" size={13} /> Trainer name
          </span>
          <input
            type="text"
            aria-label={`Trainer name for ${name}`}
            placeholder="Trainer name"
            value={form.trainerName}
            disabled={controlsDisabled(leadId)}
            onChange={(event) =>
              handleDemoChange(leadId, "trainerName", event.target.value)
            }
            className="hrd-input"
          />
        </div>
      );
    }

    return <span className="hrd-muted-note">Select a mode first</span>;
  };

  // Status badge + drop-down + messages (still uses PUT /leads/{id})
  const renderStatusCell = (lead, leadId, leadName, listType) => (
    <div className="hrd-stack">
      <StatusBadge status={getStatus(lead)} />

      <select
        aria-label={`Status for ${leadName}`}
        value={getStatus(lead)}
        disabled={updatingLeadId === leadId || leadId == null}
        onChange={(event) =>
          handleStatusChange(lead, event.target.value, listType)
        }
        className="hrd-select"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <Feedback
        compact
        ok={!statusErrors[leadId]}
        text={statusMessages[leadId]}
      />

      {updatingLeadId === leadId && (
        <p className="hrd-hint is-compact">
          <Spin /> Saving status...
        </p>
      )}
    </div>
  );

  // Sidebar navigation helpers
  const showDashboard = () => {
    setActiveSection("dashboard");
    setStatusFilter("ALL");
    setFollowUpFilter("ALL");
    setDemoFilter("ALL");
  };

  const showLeads = () => {
    setActiveSection("leads");
    setStatusFilter("ALL");
    setFollowUpFilter("ALL");
    setDemoFilter("ALL");
  };

  const showFollowUps = () => {
    setActiveSection("followups");
    setStatusFilter("ALL");
    setFollowUpFilter("SCHEDULED");
    setDemoFilter("ALL");
  };

  const showDemoClasses = () => {
    setActiveSection("demos");
    setStatusFilter("ALL");
    setFollowUpFilter("ALL");
    setDemoFilter("ALL");
  };

  const showAdmissions = () => {
    setActiveSection("admissions");
  };

  const showMarketingLeads = () => {
    setActiveSection("marketing");
  };

  // Logout
  const logout = async () => {
    try {
      await apiFetch(`${API_URL}/auth/logout`, {
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

  // Navigation items (same sections and handlers as before)
  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "dashboard", onClick: showDashboard },
    { key: "leads", label: "HR Enquiries", icon: "enquiries", onClick: showLeads },
    { key: "marketing", label: "Marketing Leads", icon: "marketing", onClick: showMarketingLeads },
    { key: "followups", label: "Follow-ups", icon: "followup", onClick: showFollowUps },
    { key: "demos", label: "Demo Classes", icon: "demo", onClick: showDemoClasses },
    { key: "admissions", label: "Admissions", icon: "admission", onClick: showAdmissions },
  ];

  const statCards = [
    { label: "Total Enquiries", value: leads.length, note: "HR enquiries", icon: "users", tone: "indigo" },
    { label: "New Enquiries", value: countStatus("NEW"), note: "Awaiting the next action", icon: "spark", tone: "blue" },
    { label: "Scheduled Follow-ups", value: scheduledFollowUps, note: "Your leads with a follow-up date", icon: "followup", tone: "violet" },
    { label: "Follow-ups Due Today", value: followUpsDueToday, note: "Scheduled for today's date", icon: "calendarCheck", tone: "amber" },
    { label: "Overdue Follow-ups", value: overdueFollowUps, note: "Follow-up dates before today", icon: "alert", tone: "red" },
    { label: "Scheduled Demos", value: scheduledDemos, note: "Your demo classes scheduled", icon: "demo", tone: "blue" },
    { label: "Completed Demos", value: completedDemos, note: "Your demo classes completed", icon: "check", tone: "green" },
    { label: "Admissions", value: admissions.length, note: "Saved admission records", icon: "admission", tone: "green" },
    { label: "Marketing Leads", value: marketingLeads.length, note: "Leads created by Marketing", icon: "marketing", tone: "violet" },
  ];

  const followUpChips = [
    { key: "SCHEDULED", label: "Scheduled", count: scheduledFollowUps, tone: "upcoming" },
    { key: "TODAY", label: "Due today", count: followUpsDueToday, tone: "today" },
    { key: "OVERDUE", label: "Overdue", count: overdueFollowUps, tone: "overdue" },
  ];

  return (
    <div className="crm-app hr-dashboard-page">
      {sidebarOpen && (
        <div
          className="hrd-scrim"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="hrd-sidebar"
        className={`sidebar ${sidebarOpen ? "is-open" : ""}`}
        aria-label="HR navigation"
      >
        <div className="hrd-brand-row">
          <span className="hrd-brand-mark" aria-hidden="true">
            IZ
          </span>
          <h2 className="brand">IZEON CRM</h2>
          <button
            type="button"
            className="hrd-icon-btn hrd-sidebar-close"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${
                activeSection === item.key ? "active" : ""
              }`}
              type="button"
              aria-current={activeSection === item.key ? "page" : undefined}
              onClick={() => {
                item.onClick();
                setSidebarOpen(false);
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="hrd-sidebar-foot">
          <button className="nav-item" type="button" onClick={logout}>
            <Icon name="logout" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div className="hrd-topbar-title">
            <button
              type="button"
              className="hrd-icon-btn hrd-menu-btn"
              aria-label="Open navigation"
              aria-controls="hrd-sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              <Icon name="menu" />
            </button>

            <div>
              <h1>{SECTION_TITLES[activeSection]}</h1>
              <p>Daily Enquiry Operations</p>
            </div>
          </div>

          <div className="profile">
            <span className="profile-avatar">
              {(user?.name || "HR").charAt(0).toUpperCase()}
            </span>
            <span className="hrd-profile-text">
              <span className="hrd-profile-name">{user?.name || "HR"}</span>
              <span className="hrd-profile-role">{user?.role || "HR"}</span>
            </span>
          </div>
        </header>

        {/* Keyed wrapper gives each section a gentle entrance. All data and
            form state lives in this component, so nothing is lost. */}
        <div className="hrd-view" key={activeSection}>
          {/* Dashboard Welcome */}
          {activeSection === "dashboard" && (
            <section className="welcome-section hrd-hero">
              <h2>Welcome, {user?.name || "HR"}!</h2>
              <p>
                Review enquiries and track their progress through follow-ups,
                demo classes, and admissions.
              </p>
            </section>
          )}

          {/* Statistics */}
          {activeSection === "dashboard" && (
            <section className="stats-grid" aria-label="Dashboard statistics">
              {statCards.map((card) => (
                <article
                  key={card.label}
                  className={`stat-card hrd-tone-${card.tone}`}
                >
                  <div className="hrd-stat-top">
                    <span>{card.label}</span>
                    <span className="hrd-stat-icon" aria-hidden="true">
                      <Icon name={card.icon} size={18} />
                    </span>
                  </div>
                  <h2>{card.value}</h2>
                  <p>{card.note}</p>
                </article>
              ))}
            </section>
          )}

          {/* HR Enquiry Management */}
          {(activeSection === "leads" ||
            activeSection === "followups") && (
            <section className="welcome-section hrd-panel" id="hr-enquiries">
              <div className="hrd-panel-head">
                <div>
                  <h2>
                    {activeSection === "followups"
                      ? "Follow-ups"
                      : "HR Enquiry Management"}
                  </h2>
                  <p>
                    Search, filter, add enquiries, update statuses, and
                    schedule follow-ups.
                  </p>
                </div>

                <button
                  className="primary-button"
                  type="button"
                  aria-expanded={showAddForm}
                  onClick={() => {
                    setShowAddForm((previous) => !previous);
                    setAddMessage("");
                    setAddSuccess(false);
                  }}
                >
                  {showAddForm ? (
                    <>
                      <Icon name="close" size={15} /> Close Form
                    </>
                  ) : (
                    <>
                      <Icon name="plus" size={15} /> Add Enquiry
                    </>
                  )}
                </button>
              </div>

              {/* Add Enquiry Form */}
              {showAddForm && (
                <form onSubmit={handleAddEnquiry} className="hrd-form">
                  <h3>New Student Enquiry</h3>

                  <div className="hrd-form-grid">
                    <div className="hrd-field">
                      <label htmlFor="enquiry-name">Student Name</label>
                      <input
                        id="enquiry-name"
                        type="text"
                        placeholder="Enter student name"
                        value={newLead.name}
                        onChange={(event) =>
                          setNewLead({ ...newLead, name: event.target.value })
                        }
                        required
                        className="hrd-input"
                      />
                    </div>

                    <div className="hrd-field">
                      <label htmlFor="enquiry-email">Email Address</label>
                      <input
                        id="enquiry-email"
                        type="email"
                        placeholder="Enter email address"
                        value={newLead.email}
                        onChange={(event) =>
                          setNewLead({ ...newLead, email: event.target.value })
                        }
                        required
                        className="hrd-input"
                      />
                    </div>

                    <div className="hrd-field">
                      <label htmlFor="enquiry-phone">Phone Number</label>
                      <input
                        id="enquiry-phone"
                        type="tel"
                        placeholder="Enter phone number"
                        value={newLead.phone}
                        onChange={(event) =>
                          setNewLead({ ...newLead, phone: event.target.value })
                        }
                        required
                        className="hrd-input"
                      />
                    </div>

                    <div className="hrd-field">
                      <label htmlFor="enquiry-course">Interested Course</label>
                      <input
                        id="enquiry-course"
                        type="text"
                        placeholder="Example: Java Full Stack"
                        value={newLead.interestedCourse}
                        onChange={(event) =>
                          setNewLead({
                            ...newLead,
                            interestedCourse: event.target.value,
                          })
                        }
                        required
                        className="hrd-input"
                      />
                    </div>
                  </div>

                  <div className="hrd-form-actions">
                    <button
                      className="primary-button"
                      type="submit"
                      disabled={addingLead}
                    >
                      {addingLead && <Spin />}
                      {addingLead ? "Saving..." : "Save Enquiry"}
                    </button>
                  </div>

                  <Feedback ok={addSuccess} text={addMessage} />
                </form>
              )}

              {/* Follow-up quick filters (use the existing follow-up filter) */}
              {activeSection === "followups" && (
                <div className="hrd-chips" role="group" aria-label="Follow-up quick filters">
                  {followUpChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      className={`hrd-chip hrd-chip--${chip.tone}`}
                      aria-pressed={followUpFilter === chip.key}
                      onClick={() => setFollowUpFilter(chip.key)}
                    >
                      <span className="hrd-chip-count">{chip.count}</span>
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Search and Filters */}
              <div className="hrd-toolbar">
                <div className="hrd-search-wrap">
                  <Icon name="search" size={16} />
                  <input
                    type="search"
                    aria-label="Search enquiries"
                    placeholder="Search name, email, phone, or course"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="hrd-input hrd-search"
                  />
                </div>

                <select
                  aria-label="Filter by enquiry status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="hrd-select hrd-filter"
                >
                  <option value="ALL">All statuses</option>
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="INTERESTED">Interested</option>
                  <option value="NOT INTERESTED">Not Interested</option>
                  <option value="FOLLOW UP">Follow-up</option>
                  <option value="DEMO SCHEDULED">Demo scheduled</option>
                  <option value="ADMITTED">Admitted</option>
                </select>

                <select
                  aria-label="Filter by follow-up date"
                  value={followUpFilter}
                  onChange={(event) => setFollowUpFilter(event.target.value)}
                  className="hrd-select hrd-filter"
                >
                  <option value="ALL">All follow-ups</option>
                  <option value="SCHEDULED">Scheduled follow-ups</option>
                  <option value="TODAY">Due today</option>
                  <option value="OVERDUE">Overdue follow-ups</option>
                </select>
              </div>

              {renderActivityStatus()}

              {loading && <TableSkeleton label="Loading enquiries" />}

              {error && (
                <div className="hrd-alert" role="alert">
                  <Icon name="alert" size={16} />
                  <span>{error}</span>
                </div>
              )}

              {!loading && !error && (
                <div className="hrd-table-wrap">
                  <table className="hrd-table">
                    <thead>
                      <tr>
                        {[
                          "Name",
                          "Email",
                          "Phone",
                          "Course",
                          "Status",
                          "Follow-up Date",
                          "Follow-up Notes",
                          "Action",
                        ].map((heading) => (
                          <th key={heading}>{heading}</th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filteredLeads.map((lead, index) => {
                        const leadId = lead.id ?? lead.leadId;
                        const leadName = lead.name || "enquiry";

                        const followUpForm = getFollowUpValues(leadId);

                        return (
                          <tr key={leadId ?? index}>
                            <td className="hrd-cell-strong">
                              {lead.name || lead.fullName || "—"}
                            </td>

                            <td>{lead.email || "—"}</td>

                            <td>{lead.phone || "—"}</td>

                            <td>{lead.interestedCourse || lead.course || "—"}</td>

                            <td>
                              {renderStatusCell(lead, leadId, leadName, "hr")}
                            </td>

                            <td>
                              <div className="hrd-stack">
                                <input
                                  type="date"
                                  aria-label={`Follow-up date for ${leadName}`}
                                  min={today}
                                  value={followUpForm.followUpDate}
                                  disabled={controlsDisabled(leadId)}
                                  onChange={(event) =>
                                    handleFollowUpChange(
                                      leadId,
                                      "followUpDate",
                                      event.target.value
                                    )
                                  }
                                  className="hrd-input"
                                />
                                <FollowUpTag
                                  date={followUpForm.followUpDate}
                                  today={today}
                                />
                              </div>
                            </td>

                            <td>
                              <textarea
                                aria-label={`Follow-up notes for ${leadName}`}
                                placeholder="Enter follow-up notes"
                                rows={2}
                                value={followUpForm.followUpNotes}
                                disabled={controlsDisabled(leadId)}
                                onChange={(event) =>
                                  handleFollowUpChange(
                                    leadId,
                                    "followUpNotes",
                                    event.target.value
                                  )
                                }
                                className="hrd-textarea"
                              />
                            </td>

                            <td>
                              <div className="hrd-stack">
                                <button
                                  type="button"
                                  className="primary-button"
                                  disabled={
                                    controlsDisabled(leadId) ||
                                    savingFollowUpId === leadId
                                  }
                                  onClick={() => handleSaveFollowUp(lead)}
                                >
                                  {savingFollowUpId === leadId && <Spin />}
                                  {savingFollowUpId === leadId
                                    ? "Saving..."
                                    : "Save Follow-up"}
                                </button>

                                <Feedback
                                  compact
                                  ok={!followUpErrors[leadId]}
                                  text={followUpMessages[leadId]}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredLeads.length === 0 && (
                        <EmptyRow
                          colSpan={8}
                          title="No enquiries found."
                          hint="Try a different search or filter, or add a new enquiry."
                        />
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Marketing Leads - separate from HR enquiries */}
          {activeSection === "marketing" && (
            <section
              className="welcome-section hrd-panel"
              id="marketing-leads"
            >
              <div className="hrd-panel-head">
                <div>
                  <h2>Marketing Leads</h2>
                  <p>
                    Manage leads created by the Marketing team separately from
                    HR enquiries: update statuses, schedule follow-ups, and
                    book demo classes. Admissions are recorded in the
                    Admissions section.
                  </p>
                </div>
              </div>

              {renderActivityStatus()}

              {marketingLoading && (
                <TableSkeleton label="Loading Marketing leads" />
              )}

              {marketingError && (
                <div className="hrd-alert" role="alert">
                  <Icon name="alert" size={16} />
                  <span>{marketingError}</span>
                </div>
              )}

              {!marketingLoading && !marketingError && (
                <div className="hrd-table-wrap">
                  <table className="hrd-table hrd-table--wide">
                    <thead>
                      <tr>
                        {[
                          "Name",
                          "Email",
                          "Phone",
                          "Course",
                          "Source",
                          "Status",
                          "Follow-up",
                          "Demo Class",
                        ].map((heading) => (
                          <th key={heading}>{heading}</th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {marketingLeads.map((lead, index) => {
                        const leadId = lead.id ?? lead.leadId;
                        const leadName = lead.name || "Marketing lead";

                        const followUpForm = getFollowUpValues(leadId);
                        const demoForm = getDemoValues(leadId);

                        return (
                          <tr key={leadId ?? index}>
                            <td className="hrd-cell-strong">
                              {lead.name || lead.fullName || "—"}
                            </td>

                            <td>{lead.email || "—"}</td>

                            <td>{lead.phone || "—"}</td>

                            <td>{lead.interestedCourse || lead.course || "—"}</td>

                            <td>{lead.source || "—"}</td>

                            {/* Status (unchanged: still uses PUT /leads/{id}) */}
                            <td>
                              {renderStatusCell(
                                lead,
                                leadId,
                                leadName,
                                "marketing"
                              )}
                            </td>

                            {/* Follow-up date, notes and save button */}
                            <td>
                              <div className="hrd-stack hrd-stack--panel">
                                <input
                                  type="date"
                                  aria-label={`Follow-up date for ${leadName}`}
                                  min={today}
                                  value={followUpForm.followUpDate || ""}
                                  disabled={controlsDisabled(leadId)}
                                  onChange={(event) =>
                                    handleFollowUpChange(
                                      leadId,
                                      "followUpDate",
                                      event.target.value
                                    )
                                  }
                                  className="hrd-input"
                                />

                                <FollowUpTag
                                  date={followUpForm.followUpDate}
                                  today={today}
                                />

                                <textarea
                                  aria-label={`Follow-up notes for ${leadName}`}
                                  placeholder="Enter follow-up notes"
                                  rows={2}
                                  value={followUpForm.followUpNotes || ""}
                                  disabled={controlsDisabled(leadId)}
                                  onChange={(event) =>
                                    handleFollowUpChange(
                                      leadId,
                                      "followUpNotes",
                                      event.target.value
                                    )
                                  }
                                  className="hrd-textarea"
                                />

                                <button
                                  type="button"
                                  className="primary-button"
                                  disabled={
                                    controlsDisabled(leadId) ||
                                    savingFollowUpId === leadId
                                  }
                                  onClick={() => handleSaveFollowUp(lead)}
                                >
                                  {savingFollowUpId === leadId && <Spin />}
                                  {savingFollowUpId === leadId
                                    ? "Saving..."
                                    : "Save Follow-up"}
                                </button>

                                <Feedback
                                  compact
                                  ok={!followUpErrors[leadId]}
                                  text={followUpMessages[leadId]}
                                />
                              </div>
                            </td>

                            {/* Demo date, time, status, mode, link/trainer and save button */}
                            <td>
                              <div className="hrd-stack hrd-stack--panel">
                                <DemoBadge status={demoForm.demoStatus} />

                                <input
                                  type="date"
                                  aria-label={`Demo date for ${leadName}`}
                                  min={
                                    demoForm.demoStatus === "SCHEDULED"
                                      ? today
                                      : undefined
                                  }
                                  value={demoForm.demoDate || ""}
                                  disabled={controlsDisabled(leadId)}
                                  onChange={(event) =>
                                    handleDemoChange(
                                      leadId,
                                      "demoDate",
                                      event.target.value
                                    )
                                  }
                                  className="hrd-input"
                                />

                                <input
                                  type="time"
                                  aria-label={`Demo time for ${leadName}`}
                                  value={demoForm.demoTime || ""}
                                  disabled={controlsDisabled(leadId)}
                                  onChange={(event) =>
                                    handleDemoChange(
                                      leadId,
                                      "demoTime",
                                      event.target.value
                                    )
                                  }
                                  className="hrd-input"
                                />

                                <select
                                  aria-label={`Demo status for ${leadName}`}
                                  value={demoForm.demoStatus || ""}
                                  disabled={controlsDisabled(leadId)}
                                  onChange={(event) =>
                                    handleDemoChange(
                                      leadId,
                                      "demoStatus",
                                      event.target.value
                                    )
                                  }
                                  className="hrd-select"
                                >
                                  <option value="">Select status</option>
                                  <option value="SCHEDULED">Scheduled</option>
                                  <option value="COMPLETED">Completed</option>
                                  <option value="CANCELLED">Cancelled</option>
                                </select>

                                {renderDemoModeSelect(
                                  leadId,
                                  leadName,
                                  demoForm
                                )}

                                {renderDemoDetailInput(
                                  leadId,
                                  leadName,
                                  demoForm
                                )}

                                <button
                                  type="button"
                                  className="primary-button"
                                  disabled={
                                    controlsDisabled(leadId) ||
                                    savingDemoId === leadId
                                  }
                                  onClick={() =>
                                    handleSaveDemo(lead, "marketing")
                                  }
                                >
                                  {savingDemoId === leadId && <Spin />}
                                  {savingDemoId === leadId
                                    ? "Saving..."
                                    : "Save Demo"}
                                </button>

                                <Feedback
                                  compact
                                  ok={!demoErrors[leadId]}
                                  text={demoMessages[leadId]}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {marketingLeads.length === 0 && (
                        <EmptyRow
                          colSpan={8}
                          title="No Marketing leads found."
                          hint="Leads created by the Marketing team will appear here."
                        />
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Demo Class Management */}
          {activeSection === "demos" && (
            <section
              className="welcome-section hrd-panel"
              id="hr-demo-classes"
            >
              <div className="hrd-panel-head">
                <div>
                  <h2>Demo Class Management</h2>
                  <p>
                    Schedule demo classes for enquiries and track their
                    progress.
                  </p>
                </div>
              </div>

              <div className="hrd-toolbar">
                <div className="hrd-search-wrap">
                  <Icon name="search" size={16} />
                  <input
                    type="search"
                    aria-label="Search demo classes"
                    placeholder="Search student name, email, or course"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="hrd-input hrd-search"
                  />
                </div>

                <select
                  aria-label="Filter demo classes"
                  value={demoFilter}
                  onChange={(event) => setDemoFilter(event.target.value)}
                  className="hrd-select hrd-filter"
                >
                  <option value="ALL">All demo classes</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="UPCOMING">Upcoming demos</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {renderActivityStatus()}

              {loading && <TableSkeleton label="Loading demo classes" />}

              {error && (
                <div className="hrd-alert" role="alert">
                  <Icon name="alert" size={16} />
                  <span>{error}</span>
                </div>
              )}

              {!loading && !error && (
                <div className="hrd-table-wrap">
                  <table className="hrd-table">
                    <thead>
                      <tr>
                        {[
                          "Student",
                          "Course",
                          "Demo Date",
                          "Demo Time",
                          "Demo Status",
                          "Demo Mode",
                          "Google Meet Link / Trainer",
                          "Action",
                        ].map((heading) => (
                          <th key={heading}>{heading}</th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {/* filteredLeads already applies the demo filter */}
                      {filteredLeads.map((lead, index) => {
                        const leadId = lead.id ?? lead.leadId;
                        const leadName = lead.name || "enquiry";

                        const form = getDemoValues(leadId);

                        return (
                          <tr key={leadId ?? index}>
                            <td>
                              <strong className="hrd-cell-strong">
                                {lead.name || lead.fullName || "—"}
                              </strong>
                              <p className="hrd-sub">{lead.email || "—"}</p>
                            </td>

                            <td>{lead.interestedCourse || lead.course || "—"}</td>

                            <td>
                              <input
                                type="date"
                                aria-label={`Demo date for ${leadName}`}
                                min={
                                  form.demoStatus === "SCHEDULED"
                                    ? today
                                    : undefined
                                }
                                value={form.demoDate}
                                disabled={controlsDisabled(leadId)}
                                onChange={(event) =>
                                  handleDemoChange(
                                    leadId,
                                    "demoDate",
                                    event.target.value
                                  )
                                }
                                className="hrd-input"
                              />
                            </td>

                            <td>
                              <input
                                type="time"
                                aria-label={`Demo time for ${leadName}`}
                                value={form.demoTime}
                                disabled={controlsDisabled(leadId)}
                                onChange={(event) =>
                                  handleDemoChange(
                                    leadId,
                                    "demoTime",
                                    event.target.value
                                  )
                                }
                                className="hrd-input"
                              />
                            </td>

                            <td>
                              <div className="hrd-stack">
                                <DemoBadge status={form.demoStatus} />
                                <select
                                  aria-label={`Demo status for ${leadName}`}
                                  value={form.demoStatus}
                                  disabled={controlsDisabled(leadId)}
                                  onChange={(event) =>
                                    handleDemoChange(
                                      leadId,
                                      "demoStatus",
                                      event.target.value
                                    )
                                  }
                                  className="hrd-select"
                                >
                                  <option value="">Select status</option>
                                  <option value="SCHEDULED">Scheduled</option>
                                  <option value="COMPLETED">Completed</option>
                                  <option value="CANCELLED">Cancelled</option>
                                </select>
                              </div>
                            </td>

                            <td>
                              {renderDemoModeSelect(leadId, leadName, form)}
                            </td>

                            <td>
                              {renderDemoDetailInput(leadId, leadName, form)}
                            </td>

                            <td>
                              <div className="hrd-stack">
                                <button
                                  type="button"
                                  className="primary-button"
                                  disabled={
                                    controlsDisabled(leadId) ||
                                    savingDemoId === leadId
                                  }
                                  onClick={() => handleSaveDemo(lead)}
                                >
                                  {savingDemoId === leadId && <Spin />}
                                  {savingDemoId === leadId
                                    ? "Saving..."
                                    : "Save Demo"}
                                </button>

                                <Feedback
                                  compact
                                  ok={!demoErrors[leadId]}
                                  text={demoMessages[leadId]}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredLeads.length === 0 && (
                        <EmptyRow
                          colSpan={8}
                          title="No demo classes match this filter."
                          hint="Change the filter or search to see more enquiries."
                        />
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Admissions Management */}
          {activeSection === "admissions" && (
            <section
              className="welcome-section hrd-panel"
              id="hr-admissions"
            >
              <div className="hrd-panel-head">
                <div>
                  <h2>Admissions Management</h2>
                  <p>
                    Convert an enquiry or Marketing lead into an admission and
                    track course fee payments.
                  </p>
                </div>

                <button
                  className="primary-button"
                  type="button"
                  aria-expanded={showAdmissionForm}
                  onClick={() => {
                    setShowAdmissionForm((previous) => !previous);
                    setAdmissionMessage("");
                    setAdmissionSuccess(false);
                  }}
                  disabled={admissionCandidatesCount === 0}
                >
                  {showAdmissionForm ? (
                    <>
                      <Icon name="close" size={15} /> Close Form
                    </>
                  ) : (
                    <>
                      <Icon name="plus" size={15} /> Record Admission
                    </>
                  )}
                </button>
              </div>

              {admissionCandidatesCount === 0 && !admissionLoading && (
                <p className="hrd-hint">
                  All existing enquiries and Marketing leads already have
                  admission records, or none are available.
                </p>
              )}

              {showAdmissionForm && (
                <form onSubmit={handleCreateAdmission} className="hrd-form">
                  <h3>New Admission</h3>

                  <div className="hrd-form-grid">
                    <div className="hrd-field hrd-field--full">
                      <label htmlFor="admission-lead">
                        Select Enquiry / Student
                      </label>
                      <select
                        id="admission-lead"
                        value={admissionForm.leadId}
                        onChange={(event) =>
                          setAdmissionForm((previous) => ({
                            ...previous,
                            leadId: event.target.value,
                          }))
                        }
                        required
                        className="hrd-select"
                      >
                        <option value="">Select a student enquiry</option>

                        {leadsAvailableForAdmission.length > 0 && (
                          <optgroup label="HR Enquiries">
                            {leadsAvailableForAdmission.map((lead) => (
                              <option
                                key={`hr-${lead.id ?? lead.leadId}`}
                                value={lead.id ?? lead.leadId}
                              >
                                {lead.name || lead.fullName || "Unnamed student"}{" "}
                                —{" "}
                                {lead.interestedCourse ||
                                  lead.course ||
                                  "Course not specified"}
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {marketingLeadsAvailableForAdmission.length > 0 && (
                          <optgroup label="Marketing Leads">
                            {marketingLeadsAvailableForAdmission.map((lead) => (
                              <option
                                key={`marketing-${lead.id ?? lead.leadId}`}
                                value={lead.id ?? lead.leadId}
                              >
                                {lead.name || lead.fullName || "Unnamed student"}{" "}
                                —{" "}
                                {lead.interestedCourse ||
                                  lead.course ||
                                  "Course not specified"}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    <div className="hrd-field">
                      <label htmlFor="admission-date">Admission Date</label>
                      <input
                        id="admission-date"
                        type="date"
                        value={admissionForm.admissionDate}
                        onChange={(event) =>
                          setAdmissionForm((previous) => ({
                            ...previous,
                            admissionDate: event.target.value,
                          }))
                        }
                        required
                        className="hrd-input"
                      />
                    </div>

                    <div className="hrd-field">
                      <label htmlFor="admission-total-fees">
                        Total Course Fees (₹)
                      </label>
                      <input
                        id="admission-total-fees"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter total course fees"
                        value={admissionForm.totalFees}
                        onChange={(event) =>
                          setAdmissionForm((previous) => ({
                            ...previous,
                            totalFees: event.target.value,
                          }))
                        }
                        required
                        className="hrd-input"
                      />
                    </div>

                    <div className="hrd-field">
                      <label htmlFor="admission-paid-fees">Fees Paid (₹)</label>
                      <input
                        id="admission-paid-fees"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter amount paid"
                        value={admissionForm.paidFees}
                        onChange={(event) =>
                          setAdmissionForm((previous) => ({
                            ...previous,
                            paidFees: event.target.value,
                          }))
                        }
                        required
                        className="hrd-input"
                      />
                    </div>
                  </div>

                  <p className="hrd-hint">
                    Payment status is calculated automatically from the total
                    fees and amount paid.
                  </p>

                  <div className="hrd-form-actions">
                    <button
                      className="primary-button"
                      type="submit"
                      disabled={savingAdmission}
                    >
                      {savingAdmission && <Spin />}
                      {savingAdmission
                        ? "Saving Admission..."
                        : "Save Admission"}
                    </button>
                  </div>
                </form>
              )}

              <Feedback ok={admissionSuccess} text={admissionMessage} />

              {admissionLoading && <TableSkeleton label="Loading admissions" />}

              {admissionError && (
                <div className="hrd-alert" role="alert">
                  <Icon name="alert" size={16} />
                  <span>{admissionError}</span>
                </div>
              )}

              {!admissionLoading && !admissionError && (
                <div className="hrd-table-wrap">
                  <table className="hrd-table">
                    <thead>
                      <tr>
                        {[
                          "Student",
                          "Course",
                          "Admission Date",
                          "Total Fees",
                          "Paid Fees",
                          "Payment Status",
                        ].map((heading) => (
                          <th key={heading}>{heading}</th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {admissions.map((admission) => {
                        const balance =
                          Number(admission.totalFees || 0) -
                          Number(admission.paidFees || 0);

                        const paymentTone =
                          admission.paymentStatus === "Paid"
                            ? "paid"
                            : admission.paymentStatus === "Partial"
                              ? "partial"
                              : "pending";

                        return (
                          <tr key={admission.id}>
                            <td className="hrd-cell-strong">
                              {admission.studentName || "—"}
                            </td>
                            <td>{admission.courseName || "—"}</td>
                            <td>{admission.admissionDate || "—"}</td>
                            <td className="hrd-money">
                              ₹
                              {Number(admission.totalFees || 0).toLocaleString(
                                "en-IN"
                              )}
                            </td>
                            <td className="hrd-money">
                              ₹
                              {Number(admission.paidFees || 0).toLocaleString(
                                "en-IN"
                              )}
                              {balance > 0 && (
                                <span className="hrd-sub">
                                  Balance ₹{balance.toLocaleString("en-IN")}
                                </span>
                              )}
                            </td>
                            <td>
                              <span
                                className={`hrd-badge hrd-badge--pay-${paymentTone}`}
                              >
                                <span
                                  className="hrd-badge-dot"
                                  aria-hidden="true"
                                />
                                {admission.paymentStatus || "Pending"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {admissions.length === 0 && (
                        <EmptyRow
                          colSpan={6}
                          title="No admission records found."
                          hint="Use Record Admission to add one."
                        />
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default HRDashboard;