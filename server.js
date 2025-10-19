// ====================
// 📦 SERVER.JS (FULL CONVERTED — HTML VERSION, complete feature parity)
// ====================

const express = require("express");
const path = require("path");
const fs = require("fs");
const session = require("express-session");

const app = express();
const PORT = 3000;

// ====================
// Middleware
// ====================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use("/data", express.static(path.join(__dirname, "data")));
app.use("/views", express.static(path.join(__dirname, "views"))); // allow direct access if needed

app.use(
  session({
    secret: "bengkel-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// ====================
// Helpers
// ====================
const dataDir = path.join(__dirname, "data");

function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("readJSON error", filePath, err);
    return [];
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("writeJSON error", filePath, err);
    return false;
  }
}

// ====================
// Data paths
// ====================
const usersPath = path.join(dataDir, "users.json");
const transPath = path.join(dataDir, "transactions.json");
const defaultCategory = "oli";

// ====================
// Middleware utils
// ====================
function ensureAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") return res.redirect("/");
  next();
}

function ensureLogged(req, res, next) {
  if (!req.session.user) return res.redirect("/");
  next();
}

// ====================
// ROUTES
// ====================

// --- LOGIN ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = readJSON(usersPath);
  const user = users.find((u) => u.username === username && u.password === password);

  if (!user) return res.send(`<script>alert("Username atau password salah!"); window.location='/';</script>`);

  req.session.user = user;
  if (user.role === "admin") return res.redirect("/admin/menu");
  else return res.redirect("/user");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ====================
// ADMIN ROUTES (serve HTML pages)
// ====================
app.get("/admin/menu", ensureAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin-menu.html"));
});

app.get("/admin/income", ensureAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin-income.html"));
});

app.get("/admin/expense", ensureAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin-expense.html"));
});

app.get("/admin/history", ensureAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin-history.html"));
});

app.get("/admin/edit-transaction/:id", ensureAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin-edit-transaction.html"));
});

app.get("/admin/stock", ensureAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin-stock.html"));
});

app.get("/admin/stock/edit/:id", ensureAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin-stock-edit.html"));
});

app.get("/report", ensureAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "report.html"));
});

// ====================
// TRANSACTIONS: add / edit / delete / history logic (kept full)
// ====================

// Add transaction (handles income that reduces stock, and expense)
app.post("/admin/add", ensureAdmin, (req, res) => {
  const { tanggal, keterangan, jumlah, jenis, barang, barangId, qty, kategori } = req.body;
  const transactions = readJSON(transPath);

  // Basic validation
  if (!tanggal || !jenis) {
    return res.status(400).send(`<script>alert("Data transaksi tidak lengkap!"); window.history.back();</script>`);
  }

  // If we don't have barangId / qty, record a simple transaction
  if (!barangId || !qty) {
    const newTrans = {
      id: Date.now(),
      tanggal,
      keterangan: keterangan || "Transaksi",
      jumlah: parseFloat(jumlah) || 0,
      jenis,
      kategori: kategori || "lainnya"
    };
    transactions.push(newTrans);
    writeJSON(transPath, transactions);
    return res.redirect("/admin/history");
  }

  // If it's a sale (income) that affects stock
  const category = (barang || defaultCategory).toLowerCase().replace(/\s+/g, "");
  const filePath = path.join(dataDir, `${category}.json`);
  const list = readJSON(filePath);
  const item = list.find((o) => String(o.id) === String(barangId));
  if (!item) return res.send("Barang tidak ditemukan");

  const qtyInt = parseInt(qty, 10);
  if (item.stok < qtyInt) {
    return res.status(400).send("Stok tidak mencukupi");
  }

  // update stock
  item.stok -= qtyInt;
  writeJSON(filePath, list);

  const newTrans = {
    id: Date.now(),
    tanggal,
    keterangan: `${barang} terjual (${item.merek})`,
    jumlah: item.harga * qtyInt,
    jenis,
    barang,
    merek: item.merek,
    qty: qtyInt,
    kategori: kategori || defaultCategory
  };
  transactions.push(newTrans);
  writeJSON(transPath, transactions);

  res.redirect("/admin/history");
});

// Edit transaction (update)
app.post("/admin/edit-transaction/:id", ensureAdmin, (req, res) => {
  const { tanggal, keterangan, jumlah, jenis, kategori } = req.body;
  const transactions = readJSON(transPath);
  const idx = transactions.findIndex(t => String(t.id) === req.params.id);
  if (idx === -1) return res.status(404).send("Transaksi tidak ditemukan");

  transactions[idx] = {
    ...transactions[idx],
    tanggal,
    keterangan: keterangan || "Transaksi",
    jumlah: parseFloat(jumlah) || 0,
    jenis,
    kategori: kategori || transactions[idx].kategori || "lainnya"
  };
  writeJSON(transPath, transactions);
  res.redirect("/admin/history");
});

// Delete transaction (AJAX)
app.delete("/admin/delete-transaction/:id", ensureAdmin, (req, res) => {
  const transactions = readJSON(transPath);
  const idx = transactions.findIndex(t => String(t.id) === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Transaksi tidak ditemukan" });

  transactions.splice(idx, 1);
  writeJSON(transPath, transactions);
  res.json({ success: true, message: "Transaksi dihapus" });
});

// History filtering endpoint (API) - optional to support client-side rendering
app.get("/api/transactions", ensureAdmin, (req, res) => {
  let transactions = readJSON(transPath);
  const { tanggal, barang, jenis, kategori } = req.query;

  if (tanggal && tanggal.trim() !== "") {
    transactions = transactions.filter(t => t.tanggal === tanggal);
  }

  if (barang && barang.trim() !== "") {
    transactions = transactions.filter(t => (t.barang || "").toLowerCase().includes(barang.toLowerCase()));
  }

  if (jenis && jenis !== "all") {
    transactions = transactions.filter(t => t.jenis === jenis);
  }

  if (kategori && kategori !== "all") {
    transactions = transactions.filter(t => t.kategori === kategori);
  }

  res.json(transactions);
});

// ====================
// REPORT calculations API (detailed)
// ====================
app.get("/api/report/detailed", ensureAdmin, (req, res) => {
  const transactions = readJSON(transPath);
  const { range, start, end } = req.query;
  const now = new Date();

  let filtered = [...transactions];

  if (range === "day") {
    const today = now.toISOString().slice(0, 10);
    filtered = filtered.filter(t => t.tanggal === today);
  } else if (range === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    filtered = filtered.filter(t => new Date(t.tanggal) >= weekAgo && new Date(t.tanggal) <= now);
  } else if (range === "month") {
    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);
    filtered = filtered.filter(t => new Date(t.tanggal) >= monthAgo && new Date(t.tanggal) <= now);
  } else if (start && end) {
    filtered = filtered.filter(t => new Date(t.tanggal) >= new Date(start) && new Date(t.tanggal) <= new Date(end));
  }

  const totalIncome = filtered.filter(t => t.jenis === "income").reduce((sum, t) => sum + (t.jumlah || 0), 0);
  const totalExpense = filtered.filter(t => t.jenis === "expense").reduce((sum, t) => sum + (t.jumlah || 0), 0);
  const saldo = totalIncome - totalExpense;

  // per-period aggregations
  const today = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7); const weekStart = weekAgo.toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const dayIncome = transactions.filter(t => t.jenis === "income" && t.tanggal === today).reduce((s, t) => s + (t.jumlah || 0), 0);
  const weekIncome = transactions.filter(t => t.jenis === "income" && t.tanggal >= weekStart).reduce((s, t) => s + (t.jumlah || 0), 0);
  const monthIncome = transactions.filter(t => t.jenis === "income" && t.tanggal >= monthStart).reduce((s, t) => s + (t.jumlah || 0), 0);

  // item sales aggregation
  function getItemSales(trans) {
    const items = {};
    trans.filter(t => t.jenis === "income" && t.barang && !isNaN(t.qty)).forEach(t => {
      items[t.barang] = (items[t.barang] || 0) + parseInt(t.qty, 10);
    });
    return items;
  }

  const dayItems = getItemSales(transactions.filter(t => t.tanggal === today));
  const weekItems = getItemSales(transactions.filter(t => t.tanggal >= weekStart));
  const monthItems = getItemSales(transactions.filter(t => t.tanggal >= monthStart));

  function topAndLow(items) {
    const entries = Object.entries(items);
    if (entries.length === 0) return { top: ["Tidak ada", 0], low: ["Tidak ada", 0] };
    entries.sort((a,b) => b[1] - a[1]);
    const top = entries[0];
    const low = entries.slice().sort((a,b) => a[1] - b[1])[0];
    return { top, low };
  }

  const dayTL = topAndLow(dayItems);
  const weekTL = topAndLow(weekItems);
  const monthTL = topAndLow(monthItems);

  const cashflowDay = transactions.filter(t => t.tanggal === today).reduce((sum,t) => sum + (t.jenis === "income" ? t.jumlah : -t.jumlah), 0);
  const cashflowWeek = transactions.filter(t => t.tanggal >= weekStart).reduce((sum,t) => sum + (t.jenis === "income" ? t.jumlah : -t.jumlah), 0);
  const cashflowMonth = transactions.filter(t => t.tanggal >= monthStart).reduce((sum,t) => sum + (t.jenis === "income" ? t.jumlah : -t.jumlah), 0);

  // expense breakdown
  const expenseBreakdown = {};
  filtered.filter(t => t.jenis === "expense").forEach(t => {
    const cat = t.kategori || "lainnya";
    expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + (t.jumlah || 0);
  });

  res.json({
    totalIncome,
    totalExpense,
    saldo,
    dayIncome, weekIncome, monthIncome,
    dayTop: dayTL.top, dayLow: dayTL.low,
    weekTop: weekTL.top, weekLow: weekTL.low,
    monthTop: monthTL.top, monthLow: monthTL.low,
    cashflowDay, cashflowWeek, cashflowMonth,
    expenseBreakdown
  });
});

// ====================
// STOCK management (CRUD + stock update endpoints)
// ====================

// Add stock item (category derived from barang)
app.post("/admin/stock/add", ensureAdmin, (req, res) => {
  const { barang, merek, tipe, ukuran, harga, stok } = req.body;

  if (!barang || !merek || !tipe || !ukuran || !harga || !stok) {
    return res.status(400).json({ success: false, error: "Data tidak lengkap!" });
  }

  const category = barang.toLowerCase().replace(/\s+/g, "");
  const filePath = path.join(dataDir, `${category}.json`);
  let arr = readJSON(filePath);

  const newId = arr.length > 0 ? Math.max(...arr.map(item => item.id)) + 1 : 1;

  const newItem = {
    id: newId,
    merek,
    tipe,
    ukuran,
    harga: parseInt(harga),
    stok: parseInt(stok)
  };

  arr.push(newItem);
  writeJSON(filePath, arr);

  res.json({ success: true, message: "Item berhasil ditambahkan" });
});

// Delete stock
app.post("/api/stock/delete/:category/:id", ensureAdmin, (req, res) => {
  const { category, id } = req.params;
  const cat = (category || defaultCategory).toLowerCase();
  const filePath = path.join(dataDir, `${cat}.json`);
  let arr = readJSON(filePath);

  const index = arr.findIndex((item) => String(item.id) === String(id));
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Item tidak ditemukan" });
  }

  arr.splice(index, 1);
  writeJSON(filePath, arr);

  return res.json({ success: true, message: "Item berhasil dihapus" });
});

// Edit stock
app.post("/api/stock/edit/:category/:id", ensureAdmin, (req, res) => {
  const { category, id } = req.params;
  const { merek, tipe, ukuran, harga, stok } = req.body;

  if (!merek || !tipe || !ukuran || !harga || !stok) {
    return res.status(400).json({ success: false, error: "Data tidak lengkap!" });
  }

  const filePath = path.join(dataDir, `${category}.json`);
  let arr = readJSON(filePath);

  const index = arr.findIndex(item => String(item.id) === String(id));
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Item tidak ditemukan" });
  }

  arr[index] = {
    ...arr[index],
    merek,
    tipe,
    ukuran,
    harga: parseInt(harga),
    stok: parseInt(stok)
  };

  writeJSON(filePath, arr);
  return res.json({ success: true, message: "Item berhasil diupdate" });
});

// Update stock via form/button (add/reduce single)
app.post("/admin/stock/update/:action/:id", ensureAdmin, (req, res) => {
  const { action, id } = req.params;
  const filePath = path.join(dataDir, `${defaultCategory}.json`);
  const arr = readJSON(filePath);
  const idx = arr.findIndex((o) => String(o.id) === String(id));
  if (idx === -1) return res.send("Data tidak ditemukan");

  if (action === "add") arr[idx].stok = (arr[idx].stok || 0) + 1;
  else if (action === "reduce") arr[idx].stok = Math.max(0, (arr[idx].stok || 0) - 1);

  writeJSON(filePath, arr);
  res.redirect("/admin/stock");
});

// API - update stock (supports manual jumlah and action)
app.post("/api/stock/update", ensureAdmin, (req, res) => {
  const { id, category } = req.body;
  let { jumlah, action } = req.body; // ambil action & jumlah
  const cat = (category || defaultCategory).toLowerCase();
  const filePath = path.join(dataDir, `${cat}.json`);
  const arr = readJSON(filePath);
  const idx = arr.findIndex((o) => String(o.id) === String(id));
  if (idx === -1) return res.status(404).json({ success: false, error: "Data tidak ditemukan" });

  const stokAwal = parseInt(arr[idx].stok || 0);
  const qty = parseInt(jumlah) || 0;

  // Default ke 'add' kalau tidak dikirim
  if (!action) action = "add";

  if (!isNaN(qty) && qty > 0) {
    if (action === "reduce") {
      if (stokAwal < qty) {
        return res.status(400).json({ success: false, error: "Stok tidak mencukupi" });
      }
      arr[idx].stok = stokAwal - qty;
    } else if (action === "add") {
      arr[idx].stok = stokAwal + qty;
    } else {
      return res.status(400).json({ success: false, error: "Action tidak valid" });
    }
  } else if (action === "add") {
    arr[idx].stok = stokAwal + 1;
  } else if (action === "reduce") {
    arr[idx].stok = Math.max(0, stokAwal - 1);
  } else {
    return res.status(400).json({ success: false, error: "Action atau jumlah tidak valid" });
  }

  writeJSON(filePath, arr);
  return res.json({ success: true, newStock: arr[idx].stok });
});

// API get oli data
app.get("/api/oli", ensureAdmin, (req, res) => {
  const filePath = path.join(dataDir, "oli.json");
  const arr = readJSON(filePath);
  res.json(arr);
});

// Generic API get category data
app.get("/api/:category", ensureAdmin, (req, res) => {
  const category = (req.params.category || defaultCategory).toLowerCase();
  const filePath = path.join(dataDir, `${category}.json`);

  if (!fs.existsSync(filePath)) {
    writeJSON(filePath, []); // buat file kosong jika belum ada
  }

  const arr = readJSON(filePath);
  res.json(Array.isArray(arr) ? arr : []);
});

// ====================
// USER route (catalog)
// ====================
app.get("/user", ensureLogged, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "user-catalog.html"));
});

// ====================
// START SERVER
// ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}`);
});
