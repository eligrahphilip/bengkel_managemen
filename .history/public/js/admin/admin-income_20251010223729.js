const cards = document.querySelectorAll(".card");
const modal = document.getElementById("formModal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const barangInput = document.getElementById("barangInput");
const detailFields = document.getElementById("detailFields");

// === Ambil data oli dari JSON ===
async function getOliData() {
  try {
    const response = await fetch("/api/oli");
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Gagal memuat data oli:", err);
    return [];
  }
}

cards.forEach(card => {
  card.addEventListener("click", async () => {
    const barang = card.dataset.barang;
    barangInput.value = barang;
    modalTitle.textContent = "Tambah " + barang;
    detailFields.innerHTML = "";

    // ========== FORM KHUSUS OLI ==========
    if (barang === "Oli") {
      const oliList = await getOliData();
      if (!oliList.length) {
        detailFields.innerHTML = "<p style='color:red;'>Gagal memuat data oli.</p>";
        modal.style.display = "flex";
        return;
      }

      const merekSet = [...new Set(oliList.map(o => o.merek))];

      detailFields.innerHTML = `
        <label>Merek:</label>
        <select name="merek_oli" id="merekOli" required>
          <option value="">-- Pilih Merek --</option>
          ${merekSet.map(m => `<option value="${m}">${m}</option>`).join("")}
        </select>

        <label>Tipe:</label>
        <select name="tipe_oli" id="tipeOli" required disabled>
          <option value="">-- Pilih Tipe --</option>
        </select>

        <label>Ukuran (Liter):</label>
        <select name="ukuran_oli" id="ukuranOli" required disabled>
          <option value="">-- Pilih Ukuran --</option>
        </select>

        <label>Harga Satuan (Rp):</label>
        <input type="number" id="hargaOli" name="harga_oli" readonly>

        <label>Jumlah Barang:</label>
        <input type="number" id="jumlahBarang" name="jumlah_barang" required>

        <label>Total Harga (Rp):</label>
        <input type="number" id="totalHarga" name="jumlah" readonly>
      `;

      // === EVENT MEREK DIPILIH ===
      const merekSelect = document.getElementById("merekOli");
      const tipeSelect = document.getElementById("tipeOli");
      const ukuranSelect = document.getElementById("ukuranOli");
      const hargaInput = document.getElementById("hargaOli");
      const jumlahInput = document.getElementById("jumlahBarang");
      const totalInput = document.getElementById("totalHarga");

      merekSelect.addEventListener("change", () => {
        const merekDipilih = merekSelect.value;
        const tipeList = oliList
          .filter(o => o.merek === merekDipilih)
          .map(o => o.tipe);
        tipeSelect.innerHTML = `
          <option value="">-- Pilih Tipe --</option>
          ${[...new Set(tipeList)].map(t => `<option value="${t}">${t}</option>`).join("")}
        `;
        tipeSelect.disabled = false;
        ukuranSelect.disabled = true;
        ukuranSelect.innerHTML = `<option value="">-- Pilih Ukuran --</option>`;
        hargaInput.value = "";
      });

      tipeSelect.addEventListener("change", () => {
        const tipeDipilih = tipeSelect.value;
        const merekDipilih = merekSelect.value;
        const ukuranList = oliList
          .filter(o => o.merek === merekDipilih && o.tipe === tipeDipilih)
          .map(o => o.ukuran);
        ukuranSelect.innerHTML = `
          <option value="">-- Pilih Ukuran --</option>
          ${[...new Set(ukuranList)].map(u => `<option value="${u}">${u}</option>`).join("")}
        `;
        ukuranSelect.disabled = false;
        hargaInput.value = "";
      });

      ukuranSelect.addEventListener("change", () => {
        const merek = merekSelect.value;
        const tipe = tipeSelect.value;
        const ukuran = ukuranSelect.value;
        const data = oliList.find(o => o.merek === merek && o.tipe === tipe && o.ukuran === ukuran);
        if (data) hargaInput.value = data.harga;
        hitungTotal();
      });

      jumlahInput.addEventListener("input", hitungTotal);
      function hitungTotal() {
        const harga = parseFloat(hargaInput.value || 0);
        const jumlah = parseInt(jumlahInput.value || 0);
        totalInput.value = harga * jumlah;
      }
    }

    modal.style.display = "flex";
  });
});

// Tutup modal
closeModal.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });
