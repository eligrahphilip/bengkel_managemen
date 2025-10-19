// ===========================
// ADMIN-STOCK.JS - NEW LAYOUT
// ===========================

const stokSection = document.getElementById("stokSection");
const stokTitle = document.getElementById("stockTitle");
const toggleFormBtn = document.getElementById("toggleFormBtn");
const formSection = document.getElementById("formSection");
const formTitle = document.getElementById("formTitle");
const barangInput = document.getElementById("barangInput");
const searchInput = document.getElementById("searchBarang");

let currentBarang = "";
let isEditMode = false;
let currentEditId = null;

// Search functionality
searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    document.querySelectorAll("#barangList li").forEach(item => {
        const visible = item.textContent.toLowerCase().includes(query);
        item.style.display = visible ? "block" : "none";
    });
});

// Category click handler
document.querySelectorAll("#barangList li").forEach(item => {
    item.addEventListener("click", () => {
        currentBarang = item.dataset.barang.toLowerCase().replace(/\s+/g, "");
        barangInput.value = currentBarang;

        stokTitle.textContent = `Stok ${item.dataset.barang}`;
        stokSection.style.display = "block";
        formSection.style.display = "none";
        toggleFormBtn.style.display = "block";
        toggleFormBtn.textContent = "➕ Tambah Stok Baru";
        isEditMode = false;

        loadData(currentBarang);
    });
});

// Toggle form - Hanya show form, hide table
toggleFormBtn.addEventListener("click", () => {
    if (formSection.style.display === "block") {
        // Kembali ke table
        showTableMode();
    } else {
        // Show form add
        showFormMode("Tambah Stok Baru");
        renderDynamicForm(currentBarang);
    }
});

// Show table mode
function showTableMode() {
    formSection.style.display = "none";
    stokSection.style.display = "block";
    toggleFormBtn.textContent = "➕ Tambah Stok Baru";
    isEditMode = false;
    currentEditId = null;
}

// Show form mode
function showFormMode(title) {
    formSection.style.display = "block";
    stokSection.style.display = "none";
    formTitle.textContent = title;
}

// Load stock data
async function loadData(kategori) {
    const stokTable = document.getElementById("stokTable").querySelector("tbody");
    stokTable.innerHTML = `<tr><td colspan="9">Memuat data...</td></tr>`;
    try {
        const res = await fetch(`/api/${kategori}`);
        const data = await res.json();

        if (!data.length) {
            stokTable.innerHTML = `<tr><td colspan="9">Belum ada data ${kategori}</td></tr>`;
            return;
        }

        stokTable.innerHTML = "";
        data.forEach((item, i) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${i + 1}</td>
                <td>${item.merek}</td>
                <td>${item.tipe}</td>
                <td>${item.ukuran}</td>
                <td>${item.harga.toLocaleString()}</td>
                <td>${item.stok || 0}</td>
                <td>
                    <input type="number" id="edit-${item.id}" min="0" placeholder="Jumlah" style="width:70px;">
                    <button class="btn-success" data-id="${item.id}">Update Stok</button>
                </td>
                <td>
                    <button class="btn-edit" data-id="${item.id}">✏️ Edit</button>
                </td>
                <td>
                    <button class="btn-delete" data-id="${item.id}">🗑️ Hapus</button>
                </td>
            `;
            stokTable.appendChild(tr);
        });

        attachActionButtons(kategori);
    } catch (err) {
        stokTable.innerHTML = `<tr><td colspan="9">Gagal memuat data</td></tr>`;
    }
}

// Action buttons
function attachActionButtons(kategori) {
    const stokTable = document.getElementById("stokTable").querySelector("tbody");
    
    // Update stok
    stokTable.querySelectorAll(".btn-success").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            const inputVal = document.getElementById(`edit-${id}`).value;
            if (!inputVal) return alert("Masukkan jumlah stok!");

            const res = await fetch("/api/stock/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    category: kategori,
                    jumlah: parseInt(inputVal)
                })
            });
            const data = await res.json();
            if (data.success) loadData(kategori);
            else alert(data.error);
        });
    });

    // Edit item
    stokTable.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            await openEditForm(kategori, id);
        });
    });

    // Delete item
    stokTable.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", async () => {
            if (!confirm("Yakin ingin menghapus item ini?")) return;
            const res = await fetch(`/api/stock/delete/${kategori}/${btn.dataset.id}`, { 
                method: "POST" 
            });
            const data = await res.json();
            if (data.success) loadData(kategori);
            else alert(data.error);
        });
    });
}

// Open edit form
async function openEditForm(kategori, id) {
    try {
        const res = await fetch(`/api/${kategori}`);
        const data = await res.json();
        const item = data.find(i => String(i.id) === String(id));
        
        if (!item) {
            alert("Item tidak ditemukan!");
            return;
        }

        isEditMode = true;
        currentEditId = id;
        showFormMode("Edit Item Stok");
        renderEditForm(kategori, item);
    } catch (err) {
        alert("Gagal memuat data item!");
        console.error(err);
    }
}

// Render form dinamis
function renderDynamicForm(kategori, item = null) {
    const form = formSection.querySelector('form');
    form.innerHTML = `
        <input type="hidden" name="barang" value="${kategori}">
        ${getFormFields(kategori, item)}
        <div class="form-actions">
            <button type="submit" class="btn-primary">${item ? 'Update Item' : 'Simpan'}</button>
            <button type="button" class="btn-secondary" onclick="showTableMode()">Kembali</button>
        </div>
    `;

    form.onsubmit = async (e) => {
        e.preventDefault();
        if (item) {
            await updateItem(kategori, item.id);
        } else {
            await submitForm(kategori);
        }
    };
}

// Render edit form
function renderEditForm(kategori, item) {
    renderDynamicForm(kategori, item);
}

// Get form fields berdasarkan kategori
function getFormFields(kategori, item = null) {
    const isEdit = item !== null;
    const value = (field) => isEdit ? item[field] : '';
    
    const fields = {
        ban: `
            <div class="form-group">
                <label>Merek:</label>
                <input type="text" name="merek" value="${value('merek')}" required>
            </div>
            <div class="form-group">
                <label>Tipe:</label>
                <input type="text" name="tipe" value="${value('tipe')}" required>
            </div>
            <div class="form-group">
                <label>Ukuran Ban:</label>
                <input type="text" name="ukuran" value="${value('ukuran')}" required>
            </div>
            <div class="form-group">
                <label>Harga (Rp):</label>
                <input type="number" name="harga" value="${value('harga')}" required>
            </div>
            <div class="form-group">
                <label>Stok:</label>
                <input type="number" name="stok" value="${value('stok')}" required>
            </div>
        `,
        oli: `
            <div class="form-group">
                <label>Merek:</label>
                <input type="text" name="merek" value="${value('merek')}" required>
            </div>
            <div class="form-group">
                <label>Tipe:</label>
                <input type="text" name="tipe" value="${value('tipe')}" required>
            </div>
            <div class="form-group">
                <label>Ukuran (Liter):</label>
                <input type="text" name="ukuran" value="${value('ukuran')}" placeholder="0.8L, 1L, etc" required>
            </div>
            <div class="form-group">
                <label>Harga (Rp):</label>
                <input type="number" name="harga" value="${value('harga')}" required>
            </div>
            <div class="form-group">
                <label>Stok:</label>
                <input type="number" name="stok" value="${value('stok')}" required>
            </div>
        `,
        default: `
            <div class="form-group">
                <label>Merek:</label>
                <input type="text" name="merek" value="${value('merek')}" required>
            </div>
            <div class="form-group">
                <label>Tipe:</label>
                <input type="text" name="tipe" value="${value('tipe')}" required>
            </div>
            <div class="form-group">
                <label>Ukuran:</label>
                <input type="text" name="ukuran" value="${value('ukuran')}" required>
            </div>
            <div class="form-group">
                <label>Harga (Rp):</label>
                <input type="number" name="harga" value="${value('harga')}" required>
            </div>
            <div class="form-group">
                <label>Stok:</label>
                <input type="number" name="stok" value="${value('stok')}" required>
            </div>
        `
    };

    return fields[kategori] || fields.default;
}

// Submit form tambah stok
async function submitForm(kategori) {
    const formData = new FormData(formSection.querySelector('form'));
    const data = {
        barang: formData.get('barang'),
        merek: formData.get('merek'),
        tipe: formData.get('tipe'),
        ukuran: formData.get('ukuran'),
        harga: parseInt(formData.get('harga')),
        stok: parseInt(formData.get('stok'))
    };

    try {
        const res = await fetch(`/admin/stock/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        
        if (result.success) {
            alert("Barang berhasil ditambahkan!");
            showTableMode();
            loadData(kategori);
        } else {
            alert("Gagal menambahkan barang: " + result.error);
        }
    } catch (err) {
        alert("Terjadi kesalahan!");
        console.error(err);
    }
}

// Update item
async function updateItem(kategori, id) {
    const formData = new FormData(formSection.querySelector('form'));
    const data = {
        merek: formData.get('merek'),
        tipe: formData.get('tipe'),
        ukuran: formData.get('ukuran'),
        harga: parseInt(formData.get('harga')),
        stok: parseInt(formData.get('stok'))
    };

    try {
        const res = await fetch(`/api/stock/edit/${kategori}/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        
        if (result.success) {
            alert("Item berhasil diupdate!");
            showTableMode();
            loadData(kategori);
        } else {
            alert("Gagal update item: " + result.error);
        }
    } catch (err) {
        alert("Terjadi kesalahan!");
        console.error(err);
    }
}