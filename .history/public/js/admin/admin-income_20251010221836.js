const cards = document.querySelectorAll(".card");
const modal = document.getElementById("formModal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const barangInput = document.getElementById("barangInput");
const detailFields = document.getElementById("detailFields");

let oilData = [];

// Ambil data oli dari JSON
fetch("/data/oil.json")
  .then((res) => res.json())
  .then((data) => (oilData = data))
  .catch((err) => console.error("Gagal memuat data oli:", err));

cards.forEach((card) => {
  card.addEventListener("click", () => {
    const barang = card.dataset.barang;
    barangInput.value = barang;
    modalTitle.textContent = "Tambah " + barang;
    detailFields.innerHTML = "";

    if (barang === "Oli") {
      const merekSet = [...new Set(oilData.map((o) => o.merek))];

      detailFields.innerHTML = `
        <label>Merek:</label>
        <select id="merekSelect" required>
          <option value="">-- Pilih Merek --</option>
          ${merekSet.map((m) => `<option value="${m}">${m}</option>`).join("")}
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
        <input type="number" id="hargaInput" readonly>

        <label>Jumlah Barang:</label>
        <input type="number" id="jumlahInput" min="1" value="1" required>

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
        const selectedMerek = merekSelect.value;
        const tipeSet = [
          ...new Set(
            oilData.filter((o) => o.merek === selectedMerek).map((o) => o.tipe)
          ),
        ];

        tipeSelect.innerHTML =
          `<option value="">-- Pilih Tipe --</option>` +
          tipeSet.map((t) => `<option value="${t}">${t}</option>`).join("");
        tipeSelect.disabled = false;
        ukuranSelect.innerHTML = `<option value="">-- Pilih Ukuran --</option>`;
        ukuranSelect.disabled = true;
        hargaInput.value = "";
        totalInput.value = "";
      });

      tipeSelect.addEventListener("change", () => {
        const selectedMerek = merekSelect.value;
        const selectedTipe = tipeSelect.value;

        const ukuranSet = [
          ...new Set(
            oilData
              .filter(
                (o) => o.merek === selectedMerek && o.tipe === selectedTipe
              )
              .map((o) => o.ukuran)
          ),
        ];

        ukuranSelect.innerHTML =
          `<option value="">-- Pilih Ukuran --</option>` +
          ukuranSet.map((u) => `<option value="${u}">${u}</option>`).join("");
        ukuranSelect.disabled = false;
        hargaInput.value = "";
        totalInput.value = "";
      });

      ukuranSelect.addEventListener("change", () => {
        const selectedMerek = merekSelect.value;
        const selectedTipe = tipeSelect.value;
        const selectedUkuran = ukuranSelect.value;

        const found = oilData.find(
          (o) =>
            o.merek === selectedMerek &&
            o.tipe === selectedTipe &&
            o.ukuran === selectedUkuran
        );

        hargaInput.value = found ? found.harga : "";
        updateTotal();
      });

      jumlahInput.addEventListener("input", updateTotal);

      function updateTotal() {
        const harga = parseFloat(hargaInput.value) || 0;
        const jumlah = parseInt(jumlahInput.value) || 0;
        totalInput.value = harga * jumlah;
      }
    }

    modal.style.display = "flex";
  });
});

closeModal.addEventListener("click", () => (modal.style.display = "none"));
window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});
