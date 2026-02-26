import { useEffect, useState } from "react";

function Login({ onOk }) {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setErr(j.error || "Login failed");
    onOk();
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>Admin login</h2>
      <form onSubmit={submit}>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          style={{ width: "100%", padding: 10, marginTop: 8 }}
        />
        <button style={{ width: "100%", padding: 10, marginTop: 12 }}>
          Sign in
        </button>
        {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}
      </form>
    </div>
  );
}

function Orders() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    const r = await fetch("/api/admin/orders");
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setErr(j.error || "Failed to load orders");
    setItems(j.orders || []);
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ maxWidth: 1000, margin: "30px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h2>Orders</h2>
        <button onClick={load}>Refresh</button>
      </div>

      {err && <div style={{ color: "crimson" }}>{err}</div>}

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {items.map((o) => (
          <div key={o.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
            <div><b>{o.name}</b> — {o.phone}</div>
            <div>{o.system} | {o.total}</div>
            <div style={{ opacity: 0.7, fontSize: 13 }}>
              {o.createdAt} | status: {o.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminApp() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    fetch("/api/admin/me").then((r) => setAuthed(r.ok)).catch(() => setAuthed(false));
  }, []);

  if (!authed) return <Login onOk={() => setAuthed(true)} />;
  return <Orders />;
}
