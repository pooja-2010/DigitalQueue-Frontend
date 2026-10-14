
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:8080/api/queue";

function App() {
  const [tokens, setTokens] = useState([]);
  const [name, setName] = useState("");
  const [service, setService] = useState("General Enquiry");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState("home");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadQueue() {
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error();
      setTokens(await response.json());
      setError("");
    } catch {
      setError("Cannot connect to the backend. Check Spring Boot.");
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  async function generateToken(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          serviceName: service,
        }),
      });

      if (!response.ok) throw new Error();

      setName("");
      await loadQueue();
      setNotice("Your token has been generated successfully.");
    } catch {
      setError("Token creation failed. Check the backend connection.");
    } finally {
      setLoading(false);
    }
  }

  async function login(event) {
    event.preventDefault();
    setAdminError("");

    try {
      const response = await fetch(`${API}/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!result.success) {
        setAdminError(result.message || "Invalid credentials.");
        return;
      }

      setAdminLoggedIn(true);
      setPassword("");
      setPage("admin");
      setNotice("");
      await loadQueue();
    } catch {
      setAdminError("Cannot connect to the backend.");
    }
  }

  async function adminAction(path, method = "POST") {
    setAdminError("");
    setNotice("");

    try {
      const response = await fetch(`${API}${path}`, { method });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.detail || "Action failed.");
      }

      await loadQueue();
      setNotice("Queue updated successfully.");
    } catch (err) {
      setAdminError(err.message || "Unable to update the queue.");
    }
  }

  function logout() {
    setAdminLoggedIn(false);
    setUsername("");
    setPassword("");
    setAdminError("");
    setPage("home");
  }

  const waiting = tokens.filter(t => t.status === "WAITING").length;
  const serving = tokens.filter(t => t.status === "SERVING").length;
  const served = tokens.filter(t => t.status === "SERVED").length;

  return (
    <div className="app">
      <nav className="navbar">
        <div className="brand">
          Queue<span>Ease</span>
        </div>

        <div className="nav-actions">
          {adminLoggedIn ? (
            <>
              <button
                className="nav-button"
                onClick={() => setPage("admin")}
              >
                Dashboard
              </button>
              <button className="nav-button" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <button
              className="nav-button"
              onClick={() => {
                setPage("login");
                setAdminError("");
                setNotice("");
              }}
            >
              Admin Login
            </button>
          )}
        </div>
      </nav>

      <main className="container">
        {page === "login" && !adminLoggedIn && (
          <section className="panel auth-panel">
            <p className="eyebrow">RESTRICTED ACCESS</p>
            <h1>Admin Login</h1>
            <p className="muted">
              Sign in to manage the digital queue.
            </p>

            <form onSubmit={login}>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <button className="primary-btn" type="submit">
                Login to Dashboard →
              </button>
            </form>

            {adminError && <p className="error">{adminError}</p>}

            <button
              className="text-button"
              onClick={() => setPage("home")}
            >
              ← Back to customer page
            </button>
          </section>
        )}

        {page === "admin" && adminLoggedIn && (
          <>
            <section className="hero">
              <p className="eyebrow">ADMINISTRATION</p>
              <h1>Queue <span>Dashboard</span></h1>
              <p className="subtitle">
                Manage tokens and serve customers in order.
              </p>
            </section>

            <section className="stats">
              <div className="stat-card">
                <span>Total tokens</span>
                <strong>{tokens.length}</strong>
              </div>
              <div className="stat-card">
                <span>Waiting</span>
                <strong>{waiting}</strong>
              </div>
              <div className="stat-card">
                <span>Serving now</span>
                <strong>{serving}</strong>
              </div>
            </section>

            <section className="panel">
              <div className="admin-toolbar">
                <div>
                  <h2>Queue Management</h2>
                  <p className="muted">
                    {served} customer(s) served.
                  </p>
                </div>

                <button
                  className="primary-btn compact"
                  onClick={() => adminAction("/next")}
                  disabled={waiting === 0}
                >
                  Call Next Customer
                </button>
              </div>

              {notice && <p className="success">{notice}</p>}
              {adminError && <p className="error">{adminError}</p>}

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map(token => (
                      <tr key={token.id}>
                        <td><strong>{token.tokenNumber}</strong></td>
                        <td>{token.customerName}</td>
                        <td>{token.serviceName}</td>
                        <td>
                          <span className={`status ${token.status.toLowerCase()}`}>
                            {token.status}
                          </span>
                        </td>
                        <td>
                          {token.status === "SERVING" ? (
                            <button
                              className="serve-btn"
                              onClick={() =>
                                adminAction(`/${token.id}/serve`, "PUT")
                              }
                            >
                              Mark Served
                            </button>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {tokens.length === 0 && (
                <p className="empty-message">No queue tokens yet.</p>
              )}

              <button className="refresh-btn" onClick={loadQueue}>
                ↻ Refresh Queue
              </button>
            </section>
          </>
        )}

        {page === "home" && (
          <>
            <section className="hero">
              <p className="eyebrow">SMART • SIMPLE • DIGITAL</p>
              <h1>Your time matters.<br /><span>Skip the waiting.</span></h1>
              <p className="subtitle">
                Get your digital token and track your place in the queue.
              </p>
            </section>

            <section className="stats">
              <div className="stat-card">
                <span>Total Tokens</span>
                <strong>{tokens.length}</strong>
              </div>
              <div className="stat-card">
                <span>Waiting</span>
                <strong>{waiting}</strong>
              </div>
              <div className="stat-card">
                <span>Completed</span>
                <strong>{served}</strong>
              </div>
            </section>

            <section className="content-grid">
              <div className="panel">
                <h2>Get Your Token</h2>
                <p className="muted">
                  Enter your details to join the queue.
                </p>

                <form onSubmit={generateToken}>
                  <label htmlFor="customerName">Your name</label>
                  <input
                    id="customerName"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />

                  <label htmlFor="service">Choose a service</label>
                  <select
                    id="service"
                    value={service}
                    onChange={e => setService(e.target.value)}
                    required
                  >
                    <option value="General Enquiry">General Enquiry</option>
                    <option value="Billing">Billing</option>
                    <option value="Customer Support">Customer Support</option>
                    <option>Document Verification</option>
                  </select>

                  <button className="primary-btn" disabled={loading}>
                    {loading ? "Generating..." : "Generate My Token →"}
                  </button>
                </form>

                {error && <p className="error">{error}</p>}
                {notice && <p className="success">{notice}</p>}
              </div>

              <div className="panel">
                <h2>Live Queue</h2>
                <p className="muted">
                  Queue status from the server.
                </p>

                <button className="refresh-btn" onClick={loadQueue}>
                  ↻ Refresh Queue
                </button>

                {tokens.length === 0 ? (
                  <p className="empty-message">
                    No tokens yet. Generate the first token!
                  </p>
                ) : (
                  <div className="token-list">
                    {tokens.map(token => (
                      <div className="token-card" key={token.id}>
                        <div>
                          <strong className="token-number">
                            {token.tokenNumber}
                          </strong>
                          <p>{token.customerName}</p>
                          <small>{token.serviceName}</small>
                        </div>
                        <span className={`status ${token.status.toLowerCase()}`}>
                          {token.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        <footer>QueueEase · Digital Queue Management System</footer>
      </main>
    </div>
  );
}

export default App;
