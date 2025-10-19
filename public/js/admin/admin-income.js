// ===========================
// ADMIN-INCOME.JS (SIDEBAR + VALIDASI STOK)
// ===========================

const barangList = document.querySelectorAll("#barangList li");
const searchInput = document.getElementById("searchBarang");
const form = document.getElementById("transaksiForm");
const formTitle = document.getElementById("formTitle");
const detailFields = document.getElementById("detailFields");
const barangInput = document.getElementById("barangInput");

// === Filter barang dengan search ===
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  barangList.forEach(item => {
    const visible = item.textContent.toLowerCase().includes(query);
    item.style.display = visible ? "block" : "none";
  });
});

// === Klik barang dari sidebar ===
barangList.forEach(li => {
  li.addEventListener("click", async () => {
    const barang = li.dataset.barang;
    barangInput.value = barang;
    formTitle.textContent = `Tambah Transaksi ${barang}`;
    form.style.display = "block";
    detailFields.innerHTML = "";

    const kategori = barang.toLowerCase().replace(/\s+/g, "");
    const dataList = await getDataKategori(kategori);
    if (dataList.length) {
      renderFormKategori(kategori, dataList);
    } else {
      renderFormManual(barang);
    }
  });
});

// === Ambil data kategori dari JSON ===
async function getDataKategori(kategori) {
  try {
    const response = await fetch(`/api/${kategori}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (err) {
    console.error("Gagal ambil data kategori:", err);
    return [];
  }
}

// === Render form kategori (jika punya file JSON) ===
function renderFormKategori(kategori, list) {
  const merekSet = [...new Set(list.map(i => i.merek))];
  detailFields.innerHTML = `
    <label>Merek:</label>
    <select id="merekSelect" required>
      <option value="">-- Pilih Merek --</option>
      ${merekSet.map(m => `<option value="${m}">${m}</option>`).join("")}
    </select>
    <label>Tipe:</label>
    <select id="tipeSelect" required disabled><option value="">-- Pilih Tipe --</option></select>
    <label>Ukuran:</label>
    <select id="ukuranSelect" required disabled><option value="">-- Pilih Ukuran --</option></select>
    <label>Harga Satuan (Rp):</label>
    <input type="number" id="hargaInput" readonly>
    <label>Jumlah Barang:</label>
    <input type="number" id="jumlahInput" required>
    <label>Total Harga (Rp):</label>
    <input type="number" id="totalInput" readonly>
  `;

  const merekSelect = document.getElementById("merekSelect");
  const tipeSelect = document.getElementById("tipeSelect");
  const ukuranSelect = document.getElementById("ukuranSelect");
  const hargaInput = document.getElementById("hargaInput");
  const jumlahInput = document.getElementById("jumlahInput");
  const totalInput = document.getElementById("totalInput");

  merekSelect.addEventListener("change", () => {
    const tipeList = list.filter(i => i.merek === merekSelect.value).map(i => i.tipe);
    tipeSelect.innerHTML = `<option value="">-- Pilih Tipe --</option>${[...new Set(tipeList)].map(t => `<option value="${t}">${t}</option>`).join("")}`;
    tipeSelect.disabled = false;
    ukuranSelect.disabled = true;
    hargaInput.value = "";
  });

  tipeSelect.addEventListener("change", () => {
    const ukuranList = list.filter(i => i.merek === merekSelect.value && i.tipe === tipeSelect.value).map(i => i.ukuran);
    ukuranSelect.innerHTML = `<option value="">-- Pilih Ukuran --</option>${[...new Set(ukuranList)].map(u => `<option value="${u}">${u}</option>`).join("")}`;
    ukuranSelect.disabled = false;
  });

  ukuranSelect.addEventListener("change", () => {
    const data = list.find(i => i.merek === merekSelect.value && i.tipe === tipeSelect.value && i.ukuran === ukuranSelect.value);
    if (data) {
      hargaInput.value = data.harga;
      hargaInput.dataset.id = data.id;
    }
    hitungTotal();
  });

  jumlahInput.addEventListener("input", hitungTotal);
  function hitungTotal() {
    totalInput.value = (parseFloat(hargaInput.value || 0) * parseInt(jumlahInput.value || 0)) || 0;
  }

  form.onsubmit = async e => {
    e.preventDefault();
    const tanggal = form.querySelector('input[name="tanggal"]').value;
    const jumlah = parseFloat(totalInput.value || 0);
    const qty = parseInt(jumlahInput.value || 0);
    const barang = barangInput.value;
    const barangId = hargaInput.dataset.id;

    try {
      const response = await fetch("/admin/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanggal, jenis: "income", barang, barangId, qty, jumlah })
      });

      if (!response.ok) {
        alert("Transaksi gagal! Stok tidak mencukupi.");
        return;
      }

      alert("Transaksi berhasil disimpan!");
      window.location.href = "/admin/history";
    } catch (err) {
      alert("Terjadi kesalahan saat menyimpan transaksi.");
      console.error(err);
    }
  };
}

// === Render form manual (barang tanpa JSON) ===
function renderFormManual(barang) {
  detailFields.innerHTML = `
    <label>Nama Barang:</label>
    <input type="text" value="${barang}" readonly>
    <label>Harga Satuan (Rp):</label>
    <input type="number" id="hargaManual" required>
    <label>Jumlah Barang:</label>
    <input type="number" id="jumlahManual" required>
    <label>Total Harga (Rp):</label>
    <input type="number" id="totalManual" readonly>
  `;

  const harga = document.getElementById("hargaManual");
  const jumlah = document.getElementById("jumlahManual");
  const total = document.getElementById("totalManual");

  function hitungManual() {
    total.value = (parseFloat(harga.value || 0) * parseInt(jumlah.value || 0)) || 0;
  }
  harga.addEventListener("input", hitungManual);
  jumlah.addEventListener("input", hitungManual);
}
