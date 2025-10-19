const cards = document.querySelectorAll(".card");
const modal = document.getElementById("formModal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const barangInput = document.getElementById("barangInput");
const detailFields = document.getElementById("detailFields");

cards.forEach(card => {
  card.addEventListener("click", () => {
    const barang = card.dataset.barang;
    barangInput.value = barang;
    modalTitle.textContent = "Tambah " + barang;
    detailFields.innerHTML = "";

    if (barang === "Oli") {
      detailFields.innerHTML = `
        <label>Merek:</label>
        <select name="merek_oli" required>
          <option value="">-- Pilih Merek --</option>
          <option value="Castrol">Castrol</option>
          <option value="Shell">Shell</option>
          <option value="Federal">Federal</option>
          <option value="Yamalube">Yamalube</option>
        </select>

        <label>Tipe:</label>
        <select name="tipe_oli" required>
          <option value="">-- Pilih Tipe --</option>
          <option value="AT">AT</option>
          <option value="Sport">Sport</option>
          <option value="Racing">Racing</option>
        </select>

        <label>Ukuran (Liter):</label>
        <select name="ukuran_oli" required>
          <option value="">-- Pilih Ukuran --</option>
          <option value="0.8">0.8L</option>
          <option value="1">1L</option>
          <option value="2">2L</option>
        </select>
      `;
    }

    modal.style.display = "flex";
  });
});

closeModal.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });
