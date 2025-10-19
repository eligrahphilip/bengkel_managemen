const cards = document.querySelectorAll(".card");
const modal = document.getElementById("formModal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const barangInput = document.getElementById("barangInput");
const detailFields = document.getElementById("detailFields");

cards.forEach(card => {
  card.addEventListener("click", async () => {
    const barang = card.dataset.barang;
    barangInput.value = barang;
    modalTitle.textContent = "Tambah " + barang;
    detailFields.innerHTML = "";

    // Kalau barangnya Oli → ambil data dari JSON
    if (barang === "Oli") {
      try {
        const response = await fetch("/data/oil.json");
        const oilData = await response.json();

        // Ambil semua merek unik
        const merekSet = [...new Set(oilData.map(item => item.merek))];

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

        // Event ketika merek dipilih
        document.getElementById("merekSelect").addEventListener("change", e => {
          const selectedMerek = e.target.value;
          const tipeSelect = document.getElementById("tipeSelect");
          tipeSelect.disabled = false;

          const tipeSet = [...new Set(
            oilData.filter(o => o.merek === selectedMerek).map(o => o.tipe)
          )];

          tipeSelect.innerHTML = `
            <option value="">-- Pilih Tipe --</option>
            ${tipeSet.map(t => `<option value="${t}">${t}</option>`).join("")}
          `;
        });

        // Event ketika tipe dipilih
        document.getElementById("tipeSelect").addEventListener("change", e => {
          const selectedMerek = document.getElementById("merekSelect").value;
          const selectedTipe = e.target.value;
          const ukuranSelect = document.getElementById("ukuranSelect");
          ukuranSelect.disabled = false;

          const ukuranSet = [...new Set(
            oilData.filter(o => o.merek === selectedMerek && o.tipe === selectedTipe)
              .map(o => o.ukuran)
          )];

          ukuranSelect.innerHTML = `
            <option value="">-- Pilih Ukuran --</option>
            ${ukuranSet.map(u => `<option value="${u}">${u}</option>`).join("")}
          `;
        });

        // Event ketika ukuran dipilih → tampilkan harga
        document.getElementById("ukuranSelect").addEventListener("change", e => {
          const selectedMerek = document.getElementById("merekSelect").value;
          const selectedTipe = document.getElementById("tipeSelect").value;
          const selectedUkuran = e.target.value;

          const selectedItem = oilData.find(o =>
            o.merek === selectedMerek &&
            o.tipe === selectedTipe &&
            o.ukuran === selectedUkuran
          );

          document.getElementById("hargaInput").value =
            selectedItem ? selectedItem.harga.toLocaleString() : "";
        });

      } catch (error) {
        console.error("Gagal memuat data oli:", error);
      }
    }

    modal.style.display = "flex";
  });
});

closeModal.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });
