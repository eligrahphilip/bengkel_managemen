const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();
const PORT = 3000;

// ====================
// 🔧 Middleware
// ====================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// ✅ tambahkan ini biar file JSON (contoh: data/oil.json) bisa diakses
app.use("/data", express.static(path.join(__dirname, "data")));

app.use(
  session({
    secret: "bengkel-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// ====================
// 🔧 Set EJS
// ====================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ====================
// 📂 File Data
// ====================
const usersPath = path.join(__dirname, "data", "users.json");
const transPath = path.join(__dirname, "data", "transactions.json");

// ====================
// 🧩 ROUTES
// ====================

// --- LOGIN ---
app.get("/", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user)
    return res.render("login", { error: "Username atau password salah!" });

  req.session.user = user;
  if (user.role === "admin") return res.redirect("/admin/menu");
  else return res.redirect("/user");
});

// --- LOGOUT ---
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// ====================
// 👨‍🔧 ADMIN ROUTES
// ====================

// Menu utama admin
app.get("/admin/menu", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.redirect("/");
  res.render("admin-menu", { user: req.session.user });
});

// Pencatatan Pemasukan
app.get("/admin/income", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.redirect("/");
  res.render("admin-income", { user: req.session.user });
});

// Pencatatan Pengeluaran
app.get("/admin/expense", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.redirect("/");
  res.render("admin-expense", { user: req.session.user });
});

// Tambah transaksi
app.post("/admin/add", (req, res) => {
  const { tanggal, keterangan, jumlah, jenis } = req.body;
  const transactions = JSON.parse(fs.readFileSync(transPath, "utf-8"));

  const newTrans = {
    id: Date.now(),
    tanggal,
    keterangan,
    jumlah: parseFloat(jumlah),
    jenis, // income / expense
  };

  transactions.push(newTrans);
  fs.writeFileSync(transPath, JSON.stringify(transactions, null, 2));

  res.redirect("/admin/history");
});

// Riwayat transaksi
app.get("/admin/history", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.redirect("/");
  const transactions = JSON.parse(fs.readFileSync(transPath, "utf-8"));
  res.render("admin-history", { user: req.session.user, transactions });
});

// Laporan keuangan
app.get("/report", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.redirect("/");

  const transactions = JSON.parse(fs.readFileSync(transPath, "utf-8"));

  const totalIncome = transactions
    .filter((t) => t.jenis === "income")
    .reduce((sum, t) => sum + t.jumlah, 0);

  const totalExpense = transactions
    .filter((t) => t.jenis === "expense")
    .reduce((sum, t) => sum + t.jumlah, 0);

  const saldo = totalIncome - totalExpense;

  res.render("report", {
    user: req.session.user,
    transactions,
    totalIncome,
    totalExpense,
    saldo,
  });
});

// ====================
// 👤 USER ROUTE
// ====================
app.get("/user", (req, res) => {
  if (!req.session.user || req.session.user.role !== "user")
    return res.redirect("/");
  res.render("user-catalog", { user: req.session.user });
});

// ====================
// 🚀 SERVER START
// ====================
app.listen(PORT, () =>
  console.log(`✅ Server running at: http://localhost:${PORT}`)
);
