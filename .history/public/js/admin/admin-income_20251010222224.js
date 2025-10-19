const cards = document.querySelectorAll(".card");
const modal = document.getElementById("formModal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const barangInput = document.getElementById("barangInput");
const detailFields = document.getElementById("detailFields");

// Load data oli dari JSON
async function loadOliData() {
  try {
    const res = await fetch("/data/oli.json");
    if (!res.ok) throw new Error("Gagal memuat data oli");
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

cards.forEach((card) => {
  card.addEventListener("click", async () => {
    const barang = card.dataset.barang;
    barangInput.value = barang;
    modalTitle.textContent = "Tambah " + barang;
    detailFields.innerHTML = "";

    if (barang === "Oli") {
      const oliData = await loadOliData();

      // Ambil semua merek unik
      const merekUnik = [...new Set(oliData.map((o) => o.merek))];
      detailFields.innerHTML = `
        <label>Merek:</label>
        <select id="merekSelect" required>
          <option value="">-- Pilih Merek --</option>
          ${merekUnik.map((m) => `<option value="${m}">${m}</option>`).join("")}
        </select>

        <label>Tipe:</label>
        <select id="tipeSelect" required disabled>
          <option value="">-- Pilih Tipe --</option>
        </select>

        <label>Ukuran (Liter):</label>
        <select id="ukuranSelect" required disabled>
          <option value="">-- Pilih Ukuran --</option>
        </select>

        <label>Harga (Rp):</label>
        <input type="text" id="hargaField" readonly>

        <label>Jumlah Barang:</label>
        <input type="number" id="jumlahBarang" required min="1">

        <label>Total Harga (Rp):</label>
        <input type="text" id="totalHarga" readonly>
      `;

      const merekSelect = document.getElementById("merekSelect");
      const tipeSelect = document.getElementById("tipeSelect");
      const ukuranSelect = document.getElementById("ukuranSelect");
      const hargaField = document.getElementById("hargaField");
      const jumlahBarang = document.getElementById("jumlahBarang");
      const totalHarga = document.getElementById("totalHarga");

      // Saat merek dipilih
      merekSelect.addEventListener("change", () => {
        const merekDipilih = merekSelect.value;
        const tipeUnik = [
          ...new Set(
            oliData.filter((o) => o.merek === merekDipilih).map((o) => o.tipe)
          ),
        ];
        tipeSelect.innerHTML =
          `<option value="">-- Pilih Tipe --</option>` +
          tipeUnik.map((t) => `<option value="${t}">${t}</option>`).join("");
        tipeSelect.disabled = false;
        ukuranSelect.disabled = true;
        hargaField.value = "";
      });

      // Saat tipe dipilih
      tipeSelect.addEventListener("change", () => {
        const merek = merekSelect.value;
        const tipe = tipeSelect.value;
        const ukuranUnik = [
          ...new Set(
            oliData
              .filter((o) => o.merek === merek && o.tipe === tipe)
              .map((o) => o.ukuran)
          ),
        ];
        ukuranSelect.innerHTML =
          `<option value="">-- Pilih Ukuran --</option>` +
          ukuranUnik.map((u) => `<option value="${u}">${u}L</option>`).join("");
        ukuranSelect.disabled = false;
        hargaField.value = "";
      });

      // Saat ukuran dipilih
      ukuranSelect.addEventListener("change", () => {
        const merek = merekSelect.value;
        const tipe = tipeSelect.value;
        const ukuran = ukuranSelect.value;
        const data = oliData.find(
          (o) =>
            o.merek === merek && o.tipe === tipe && o.ukuran === parseFloat(ukuran)
        );
        hargaField.value = data ? data.harga.toLocaleString("id-ID") : "";
      });

      // Hitung total
      jumlahBarang.addEventListener("input", () => {
        const harga = parseInt(hargaField.value.replace(/\./g, "")) || 0;
        const jumlah = parseInt(jumlahBarang.value) || 0;
        totalHarga.value = (harga * jumlah).toLocaleString("id-ID");
      });
    }

    modal.style.display = "flex";
  });
});

closeModal.addEventListener("click", () => (modal.style.display = "none"));
window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});
