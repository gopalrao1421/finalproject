import express from "express";
import helmet from "helmet";
import session from "express-session";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";

const app = express();
const PORT = 3001;
const FILE = path.resolve("server/data.json");

if (!process.env.SESSION_SECRET || !process.env.ADMIN_PASSWORD) {
  throw new Error("Admin configuration is missing.");
}

function read() {
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function save(data) {
  fs.writeFileSync(FILE + ".tmp", JSON.stringify(data, null, 2));
  fs.renameSync(FILE + ".tmp", FILE);
}

if (!fs.existsSync(FILE)) {
  save({
    users: [],
    logs: []
  });
}

const initial = read();

if (!initial.users.some(u => u.role === "admin")) {
  initial.users.push({
    id: crypto.randomUUID(),
    name: "Administrator",
    email: "admin@expense.local",
    passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
    role: "admin",
    blocked: false
  });

  save(initial);
}

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "100kb" }));

// Reject cross-origin state-changing requests.
app.use((req, res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.get("origin");

    if (!["http://localhost:5173", "http://localhost:3001"].includes(origin)) {
      return res.status(403).json({ error: "Origin rejected" });
    }

    if (!req.is("application/json")) {
      return res.status(415).json({ error: "JSON required" });
    }
  }

  next();
});

app.use(session({
  name: "expense.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "strict",
    secure: false,
    maxAge: 30 * 60 * 1000
  }
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." }
});

function audit(action, actor) {
  const data = read();

  data.logs.unshift({
    id: crypto.randomUUID(),
    action,
    actor,
    time: new Date().toISOString()
  });

  data.logs = data.logs.slice(0, 500);
  save(data);
}

function authenticate(req, res, next) {
  const user = read().users.find(u => u.id === req.session.userId);

  if (!user || user.blocked) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = user;
  next();
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}

function publicUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

app.post("/api/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};

  if (typeof email !== "string" ||
      typeof password !== "string" ||
      password.length > 128) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const user = read().users.find(
    u => u.email === email.trim().toLowerCase()
  );

  if (!user || user.blocked ||
      !await bcrypt.compare(password, user.passwordHash)) {
    audit("Failed login", email.slice(0, 100));
    return res.status(401).json({ error: "Invalid credentials" });
  }

  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: "Session failed" });

    req.session.userId = user.id;

    audit("Successful login", user.email);

    req.session.save(err => {
      if (err) return res.status(500).json({ error: "Session failed" });
      res.json(publicUser(user));
    });
  });
});

app.get("/api/me", authenticate, (req, res) => {
  res.json(publicUser(req.user));
});

app.post("/api/logout", authenticate, (req, res) => {
  audit("Logout", req.user.email);

  req.session.destroy(() => {
    res.clearCookie("expense.sid");
    res.json({ success: true });
  });
});

app.get("/api/admin/users", authenticate, adminOnly, (req, res) => {
  res.json(read().users.map(publicUser));
});

app.get("/api/admin/logs", authenticate, adminOnly, (req, res) => {
  res.json(read().logs);
});

app.patch("/api/admin/users/:id", authenticate, adminOnly, (req, res) => {
  const data = read();
  const user = data.users.find(u => u.id === req.params.id);

  if (!user)
    return res.status(404).json({ error: "User not found" });

  if (user.role === "admin")
    return res.status(403).json({ error: "Admin account protected" });

  if (typeof req.body.blocked !== "boolean")
    return res.status(400).json({ error: "Invalid status" });

  user.blocked = req.body.blocked;
  save(data);

  audit(
    user.blocked ? "Account blocked" : "Account unblocked",
    req.user.email
  );

  res.json(publicUser(user));
});

app.get("/api/health", (req, res) => {
  res.json({ status: "online" });
});

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log("Secure backend running at http://localhost:" + PORT);
});
