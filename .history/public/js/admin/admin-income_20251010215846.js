// === ELEMENTS ===
const cards = document.querySelectorAll(".card");
const modal = document.getElementById("formModal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const barangInput = document.getElementById("barangInput");
const detailFields = document.getElementById("detailFields");

// === EVENT: KLIK KARTU BARANG ===
cards.forEach(card => {
  card.addEventListener("click", async () => {
    const barang = card.dataset.barang;
    barangInput.value = barang;
    modalTitle.textContent = "Tambah " + barang;
    detailFields.innerHTML = "";

    // === Jika barang adalah Oli ===
    if (barang.toLowerCase() === "oli") {
      try {
        // Ambil data dari JSON
        const response = await fetch("/data/oil.json");
        const oilData = await response.json();

        // Ambil merek unik
        const merekSet = [...new Set(oilData.map(item => item.merek))];

        // Template HTML awal
        detailFields.innerHTML = `
          <label>Merek:</label>
          <select id="merekSelect" name="merek_oli" required>
            <option value="">-- Pilih Merek --</option>
            ${merekSet.map(m => `<option value="${m}">${m}</option>`).join("")}
          </select>

          <label>Tipe:</label>
          <select id="tipeSelect" name="tipe_oli" required disabled>
            <option value="">-- Pilih Tipe --</option>
          </select>

          <label>Ukuran (Liter):</label>
          <select id="ukuranSelect" name="ukuran_oli" required disabled>
            <option value="">-- Pilih Ukuran --</option>
          </select>

          <label>Harga (Rp):</label>
          <input type="text" id="hargaInput" name="harga_oli" readonly>
        `;

        // === Event: Pilih Merek ===
        const merekSelect = document.getElementById("merekSelect");
        const tipeSelect = document.getElementById("tipeSelect");
        const ukuranSelect = document.getElementById("ukuranSelect");
        const hargaInput = document.getElementById("hargaInput");

        merekSelect.addEventListener("change", () => {
          const merek = merekSelect.value;
          const tipeSet = [
            ...new Set(oilData.filter(o => o.merek === merek).map(o => o.tipe))
          ];

          tipeSelect.innerHTML = `
            <option value="">-- Pilih Tipe --</option>
            ${tipeSet.map(t => `<option value="${t}">${t}</option>`).join("")}
          `;
          tipeSelect.disabled = false;
          ukuranSelect.disabled = true;
          ukuranSelect.innerHTML = `<option value="">-- Pilih Ukuran --</option>`;
          hargaInput.value = "";
        });

        // === Event: Pilih Tipe ===
        tipeSelect.addEventListener("change", () => {
          const merek = merekSelect.value;
          const tipe = tipeSelect.value;
          const ukuranSet = [
            ...new Set(
              oilData
                .filter(o => o.merek === merek && o.tipe === tipe)
                .map(o => o.liter)
            ),
          ];

          ukuranSelect.innerHTML = `
            <option value="">-- Pilih Ukuran --</option>
            ${ukuranSet.map(u => `<option value="${u}">${u}L</option>`).join("")}
          `;
          ukuranSelect.disabled = false;
          hargaInput.value = "";
        });

        // === Event: Pilih Ukuran ===
        ukuranSelect.addEventListener("change", () => {
          const merek = merekSelect.value;
          const tipe = tipeSelect.value;
          const liter = ukuranSelect.value;

          const dataTerpilih = oilData.find(
            o => o.merek === merek && o.tipe === tipe && o.liter == liter
          );

          hargaInput.value = dataTerpilih
            ? `Rp ${dataTerpilih.harga.toLocaleString()}`
            : "";
        });
      } catch (err) {
        console.error("Gagal memuat data oli:", err);
        detailFields.innerHTML = `<p style="color:red;">Gagal memuat data oli.</p>`;
      }
    }

    modal.style.display = "flex";
  });
});

// === CLOSE MODAL ===
closeModal.addEventListener("click", () => (modal.style.display = "none"));
window.addEventListener("click", e => {
  if (e.target === modal) modal.style.display = "none";
});
