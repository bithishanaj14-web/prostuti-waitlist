import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [students, setStudents] = useState([]);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");

  const loadDashboard = useCallback(async () => {
    if (!supabase) {
      navigate("/admin-login", { replace: true });
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Verify the logged-in user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        navigate("/admin-login", { replace: true });
        return;
      }

      // Verify admin authorization
      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) {
        throw new Error(adminError.message);
      }

      if (!admin) {
        throw new Error("You are not authorized to access this dashboard.");
      }

      setEmail(user.email || "");

      // Fetch waitlist records
      const { data, error: studentsError } = await supabase
        .from("waitlist")
        .select(
          "id, name, contact, student_class, referral_code, referred_by, joined_at"
        )
        .order("joined_at", { ascending: false });

      if (studentsError) {
        throw new Error(studentsError.message);
      }

      setStudents(data || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Could not load dashboard data.");
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const todaySignups = students.filter((student) => {
    if (!student.joined_at) return false;

    const date = new Date(student.joined_at);

    const localDate = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    return localDate === todayKey;
  }).length;

  const classStats = useMemo(() => {
    const counts = {};

    students.forEach((student) => {
      const className = student.student_class || "Not specified";
      counts[className] = (counts[className] || 0) + 1;
    });

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [students]);

  const referralStats = useMemo(() => {
    const referrers = {};

    students.forEach((student) => {
      if (!student.referred_by) return;

      const code = String(student.referred_by).trim();

      if (!code) return;

      referrers[code] = (referrers[code] || 0) + 1;
    });

    const codeOwners = {};

    students.forEach((student) => {
      if (student.referral_code) {
        codeOwners[String(student.referral_code).trim()] = student.name;
      }
    });

    return Object.entries(referrers)
      .map(([code, count]) => ({
        code,
        name: codeOwners[code] || "Unknown referrer",
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [students]);

  const classes = useMemo(() => {
    return [
      ...new Set(
        students
          .map((student) => student.student_class)
          .filter(Boolean)
      ),
    ].sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        [
          student.name,
          student.contact,
          student.referral_code,
          student.referred_by,
        ].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      const matchesClass =
        selectedClass === "all" ||
        student.student_class === selectedClass;

      return matchesSearch && matchesClass;
    });
  }, [students, search, selectedClass]);

  function exportCSV() {
    const headers = [
      "Name",
      "Email / Contact",
      "Class",
      "Referral Code",
      "Referred By",
      "Joined At",
    ];

    const escapeCSV = (value) => {
      let text = String(value ?? "");

      // Reduce spreadsheet formula injection risk
      if (/^[\s]*[=+\-@]/.test(text)) {
        text = "'" + text;
      }

      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = filteredStudents.map((student) => [
      student.name,
      student.contact,
      student.student_class,
      student.referral_code,
      student.referred_by,
      student.joined_at
        ? new Date(student.joined_at).toLocaleString()
        : "",
    ]);

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "prostuti-waitlist.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  async function handleLogout() {
    if (supabase) {
      await supabase.auth.signOut();
    }

    navigate("/admin-login", { replace: true });
  }

  if (checking) {
    return (
      <div className="container py-5">
        <div className="alert alert-info">
          Checking admin permissions...
        </div>
      </div>
    );
  }

  if (error && students.length === 0) {
    return (
      <div className="container py-5">
        <h2>Admin Dashboard</h2>

        <div className="alert alert-danger" role="alert">
          {error}
        </div>

        <button
          className="btn btn-primary me-2"
          onClick={loadDashboard}
          disabled={loading}
        >
          Try Again
        </button>

        <button
          className="btn btn-outline-secondary"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h2 mb-2">Prostuti Admin Dashboard</h1>
          <p className="text-muted mb-0">
            Logged in as: {email}
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            className="btn btn-outline-primary"
            onClick={loadDashboard}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>

          <button
            className="btn btn-outline-danger"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      {loading && (
        <div className="alert alert-info">
          Loading latest signup data...
        </div>
      )}

      {/* Summary cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <p className="text-muted mb-2">Total Signups</p>
              <h2 className="display-6 fw-bold mb-0">
                {students.length}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <p className="text-muted mb-2">Today's Signups</p>
              <h2 className="display-6 fw-bold mb-0">
                {todaySignups}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <p className="text-muted mb-2">Classes Represented</p>
              <h2 className="display-6 fw-bold mb-0">
                {classStats.length}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Class breakdown and referral leaderboard */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h3 className="h5 mb-3">Class Breakdown</h3>

              {classStats.length === 0 ? (
                <p className="text-muted mb-0">
                  No class data available.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th className="text-end">Signups</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classStats.map(([className, count]) => (
                        <tr key={className}>
                          <td>{className}</td>
                          <td className="text-end fw-semibold">
                            {count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h3 className="h5 mb-3">Referral Leaderboard</h3>

              {referralStats.length === 0 ? (
                <p className="text-muted mb-0">
                  No referral activity available yet.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Referrer</th>
                        <th>Code</th>
                        <th className="text-end">Referrals</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referralStats.map((item) => (
                        <tr key={item.code}>
                          <td>{item.name}</td>
                          <td>{item.code}</td>
                          <td className="text-end fw-semibold">
                            {item.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search, filter and CSV export */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
            <h3 className="h5 mb-0">Waitlist Students</h3>

            <button
              className="btn btn-success"
              onClick={exportCSV}
              disabled={filteredStudents.length === 0}
            >
              Export CSV ({filteredStudents.length})
            </button>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-8">
              <label htmlFor="studentSearch" className="form-label">
                Search students
              </label>

              <input
                id="studentSearch"
                type="search"
                className="form-control"
                placeholder="Search name, email or referral code..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="classFilter" className="form-label">
                Filter by class
              </label>

              <select
                id="classFilter"
                className="form-select"
                value={selectedClass}
                onChange={(event) =>
                  setSelectedClass(event.target.value)
                }
              >
                <option value="all">All classes</option>

                {classes.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-muted small">
            Showing {filteredStudents.length} of {students.length} records.
          </p>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Email / Contact</th>
                  <th>Class</th>
                  <th>Referral Code</th>
                  <th>Referred By</th>
                  <th>Joined At</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center text-muted py-4"
                    >
                      No students found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>{student.name || "—"}</td>
                      <td>{student.contact || "—"}</td>
                      <td>{student.student_class || "—"}</td>
                      <td>{student.referral_code || "—"}</td>
                      <td>{student.referred_by || "—"}</td>
                      <td>
                        {student.joined_at
                          ? new Date(
                              student.joined_at
                            ).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}