const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: "bengkel-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Set EJS sebagai view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// File JSON
const usersPath = path.join(__dirname, "data", "users.json");
const transPath = path.join(__dirname, "data", "transactions.json");

// --- ROUTES --- //

// Login Page
app.get("/", (req, res) => {
  res.render("login", { error: null });
});

// Proses Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(usersPath));

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.render("login", { error: "Username atau password salah!" });
  }

  req.session.user = user;

  if (user.role === "admin") return res.redirect("/admin");
  else return res.redirect("/user");
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// Halaman Admin
app.get("/admin", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.redirect("/");

  const transactions = JSON.parse(fs.readFileSync(transPath));
  res.render("admin-dashboard", { user: req.session.user, transactions });
});

// Tambah transaksi
app.post("/admin/add", (req, res) => {
  const { tanggal, barang, merek, tipe, ukuran, jumlah, harga } = req.body;
  const transactions = JSON.parse(fs.readFileSync(transPath));

  const newTrans = {
    id: Date.now(),
    tanggal,
    barang,
    merek,
    tipe,
    ukuran,
    jumlah: parseInt(jumlah),
    harga: parseFloat(harga),
    total: parseFloat(jumlah) * parseFloat(harga),
  };

  transactions.push(newTrans);
  fs.writeFileSync(transPath, JSON.stringify(transactions, null, 2));
  res.redirect("/admin");
});

// Hapus transaksi
app.get("/admin/delete/:id", (req, res) => {
  const id = parseInt(req.params.id);
  let transactions = JSON.parse(fs.readFileSync(transPath));

  transactions = transactions.filter((t) => t.id !== id);
  fs.writeFileSync(transPath, JSON.stringify(transactions, null, 2));

  res.redirect("/admin");
});

// Halaman User
app.get("/user", (req, res) => {
  if (!req.session.user || req.session.user.role !== "user")
    return res.redirect("/");
  res.render("user-catalog", { user: req.session.user });
});

// Report Page
app.get("/report", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.redirect("/");

  const transactions = JSON.parse(fs.readFileSync(transPath));
  const total = transactions.reduce((sum, t) => sum + t.total, 0);
  res.render("report", { user: req.session.user, transactions, total });
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
