// js/api.js - API Integration Functions
const API_BASE_URL = '/library-api';

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID');
}

function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
        color: ${type === 'success' ? '#155724' : '#721c24'};
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        z-index: 9999;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

// Dashboard API
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard`);
        const data = await response.json();
        
        if (response.ok) {
            updateDashboardStats(data.stats);
            updateRecentActivities(data.activities);
        } else {
            showAlert('Error loading dashboard data', 'error');
        }
    } catch (error) {
        console.error('Dashboard error:', error);
        showAlert('Connection error', 'error');
    }
}

function updateDashboardStats(stats) {
    document.getElementById('totalBuku').textContent = stats.total_buku || 0;
    document.getElementById('totalPelanggan').textContent = stats.total_pelanggan || 0;
    document.getElementById('bukuDipinjam').textContent = stats.buku_dipinjam || 0;
    document.getElementById('dendaBelumLunas').textContent = stats.denda_belum_lunas || 0;
}

function updateRecentActivities(activities) {
    const tbody = document.querySelector('#dashboard table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (activities && activities.length > 0) {
        activities.forEach(activity => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(activity.tanggal)}</td>
                <td>${activity.type}</td>
                <td>${activity.detail}</td>
                <td><span class="status-badge status-lunas">${activity.status}</span></td>
            `;
            tbody.appendChild(row);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Tidak ada aktivitas terbaru</td></tr>';
    }
}

// Buku API Functions
async function loadBuku(searchQuery = '') {
    try {
        const url = searchQuery ? 
            `${API_BASE_URL}/api/buku?search=${encodeURIComponent(searchQuery)}` : 
            `${API_BASE_URL}/api/buku`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            displayBuku(data.records || []);
            updateBukuDropdown(data.records || []);
        } else {
            document.getElementById('bukuTableBody').innerHTML = 
                '<tr><td colspan="7" class="text-center">Tidak ada buku ditemukan</td></tr>';
        }
    } catch (error) {
        console.error('Buku load error:', error);
        showAlert('Error loading books', 'error');
        document.getElementById('bukuTableBody').innerHTML = 
            '<tr><td colspan="7" class="text-center">Error memuat data</td></tr>';
    }
}

function displayBuku(books) {
    const tbody = document.getElementById('bukuTableBody');
    tbody.innerHTML = '';
    
    if (books && books.length > 0) {
        books.forEach(book => {
            const row = document.createElement('tr');
            const statusClass = book.status_buku === 'Tersedia' ? 'status-tersedia' : 'status-tidak-tersedia';
            
            row.innerHTML = `
                <td>${book.isbn_buku}</td>
                <td>${book.judul_buku}</td>
                <td>${book.penulis || '-'}</td>
                <td>${book.kategori}</td>
                <td>${book.stock}</td>
                <td><span class="status-badge ${statusClass}">${book.status_buku}</span></td>
                <td class="action-buttons">
                    <button class="btn" onclick="editBuku('${book.isbn_buku}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteBuku('${book.isbn_buku}')">Hapus</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data buku</td></tr>';
    }
}

function updateBukuDropdown(books) {
    const dropdown = document.getElementById('bukuPeminjam');
    if (dropdown) {
        dropdown.innerHTML = '<option value="">Pilih Buku</option>';
        
        books.filter(book => book.status_buku === 'Tersedia' && book.stock > 0)
              .forEach(book => {
            const option = document.createElement('option');
            option.value = book.isbn_buku;
            option.textContent = `${book.judul_buku} (Stok: ${book.stock})`;
            dropdown.appendChild(option);
        });
    }
}

async function saveBuku(formData) {
    try {
        const isEdit = formData.get('originalIsbn') ? true : false;
        const method = isEdit ? 'PUT' : 'POST';
        
        const bookData = {
            isbn_buku: formData.get('isbn'),
            judul_buku: formData.get('judulBuku'),
            penulis: formData.get('penulis'),
            penerbit: formData.get('penerbit'),
            tahun_terbit: formData.get('tahunTerbit'),
            kategori: formData.get('kategori'),
            stock: parseInt(formData.get('stock')),
            status_buku: formData.get('statusBuku')
        };
        
        const response = await fetch(`${API_BASE_URL}/api/buku`, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert(isEdit ? 'Buku berhasil diupdate!' : 'Buku berhasil ditambahkan!');
            loadBuku();
            resetBukuForm();
        } else {
            showAlert(result.message || 'Error saving book', 'error');
        }
    } catch (error) {
        console.error('Save buku error:', error);
        showAlert('Error saving book', 'error');
    }
}

async function deleteBuku(isbn) {
    if (!confirm('Apakah Anda yakin ingin menghapus buku ini?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/buku`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isbn_buku: isbn })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Buku berhasil dihapus!');
            loadBuku();
        } else {
            showAlert(result.message || 'Error deleting book', 'error');
        }
    } catch (error) {
        console.error('Delete buku error:', error);
        showAlert('Error deleting book', 'error');
    }
}

async function editBuku(isbn) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/buku/${isbn}`);
        const data = await response.json();
        
        if (response.ok && data.record) {
            const book = data.record;
            document.getElementById('isbn').value = book.isbn_buku;
            document.getElementById('judulBuku').value = book.judul_buku;
            document.getElementById('penulis').value = book.penulis || '';
            document.getElementById('penerbit').value = book.penerbit || '';
            document.getElementById('tahunTerbit').value = book.tahun_terbit || '';
            document.getElementById('kategori').value = book.kategori || '';
            document.getElementById('stock').value = book.stock || 0;
            document.getElementById('statusBuku').value = book.status_buku || '';
            
            // Add hidden field to indicate this is an edit
            const form = document.getElementById('bukuForm');
            let hiddenField = form.querySelector('input[name="originalIsbn"]');
            if (!hiddenField) {
                hiddenField = document.createElement('input');
                hiddenField.type = 'hidden';
                hiddenField.name = 'originalIsbn';
                form.appendChild(hiddenField);
            }
            hiddenField.value = isbn;
            
            // Update button text
            document.querySelector('#bukuForm button[type="submit"]').textContent = 'Update Buku';
        } else {
            showAlert('Buku tidak ditemukan', 'error');
        }
    } catch (error) {
        console.error('Edit buku error:', error);
        showAlert('Error loading book data', 'error');
    }
}

function resetBukuForm() {
    document.getElementById('bukuForm').reset();
    
    // Remove hidden field if exists
    const hiddenField = document.querySelector('input[name="originalIsbn"]');
    if (hiddenField) {
        hiddenField.remove();
    }
    
    // Reset button text
    document.querySelector('#bukuForm button[type="submit"]').textContent = 'Simpan Buku';
}

function searchBuku(query) {
    loadBuku(query);
}

// Pelanggan API Functions
async function loadPelanggan(searchQuery = '') {
    try {
        const url = searchQuery ? 
            `${API_BASE_URL}/api/pelanggan?search=${encodeURIComponent(searchQuery)}` : 
            `${API_BASE_URL}/api/pelanggan`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            displayPelanggan(data.records || []);
            updatePelangganDropdowns(data.records || []);
        } else {
            document.getElementById('pelangganTableBody').innerHTML = 
                '<tr><td colspan="7" class="text-center">Tidak ada pelanggan ditemukan</td></tr>';
        }
    } catch (error) {
        console.error('Pelanggan load error:', error);
        showAlert('Error loading customers', 'error');
    }
}

function displayPelanggan(customers) {
    const tbody = document.getElementById('pelangganTableBody');
    tbody.innerHTML = '';
    
    if (customers && customers.length > 0) {
        customers.forEach(customer => {
            const row = document.createElement('tr');
            const statusClass = customer.status_membership === 'Aktif' ? 'status-aktif' : 'status-non-aktif';
            
            row.innerHTML = `
                <td>${customer.id_pelanggan}</td>
                <td>${customer.nama}</td>
                <td>${customer.alamat || '-'}</td>
                <td>${customer.no_telp || '-'}</td>
                <td>${customer.email || '-'}</td>
                <td><span class="status-badge ${statusClass}">${customer.status_membership}</span></td>
                <td class="action-buttons">
                    <button class="btn" onclick="editPelanggan('${customer.id_pelanggan}')">Edit</button>
                    <button class="btn btn-danger" onclick="deletePelanggan('${customer.id_pelanggan}')">Hapus</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data pelanggan</td></tr>';
    }
}

function updatePelangganDropdowns(customers) {
    const dropdowns = ['pelangganPeminjam', 'pelangganMember'];
    
    dropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.innerHTML = '<option value="">Pilih Pelanggan</option>';
            customers.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.id_pelanggan;
                option.textContent = customer.nama;
                dropdown.appendChild(option);
            });
        }
    });
}

async function savePelanggan(formData) {
    try {
        const customerData = {
            nama: formData.get('namaPelanggan'),
            alamat: formData.get('alamat'),
            no_telp: formData.get('noTelp'),
            email: formData.get('email')
        };
        
        const response = await fetch(`${API_BASE_URL}/api/pelanggan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Pelanggan berhasil ditambahkan!');
            loadPelanggan();
            resetPelangganForm();
        } else {
            showAlert(result.message || 'Error saving customer', 'error');
        }
    } catch (error) {
        console.error('Save pelanggan error:', error);
        showAlert('Error saving customer', 'error');
    }
}

function editPelanggan(id) {
    showAlert('Fitur edit pelanggan akan segera tersedia', 'error');
}

function deletePelanggan(id) {
    showAlert('Fitur hapus pelanggan akan segera tersedia', 'error');
}

function resetPelangganForm() {
    document.getElementById('pelangganForm').reset();
}

function searchPelanggan(query) {
    loadPelanggan(query);
}

// Peminjaman API Functions
async function loadPeminjaman() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/peminjaman`);
        const data = await response.json();
        
        if (response.ok) {
            displayPeminjaman(data.records || []);
        } else {
            document.getElementById('peminjamanTableBody').innerHTML = 
                '<tr><td colspan="7" class="text-center">Tidak ada data peminjaman</td></tr>';
        }
    } catch (error) {
        console.error('Peminjaman load error:', error);
        showAlert('Error loading borrowing records', 'error');
    }
}

function displayPeminjaman(borrowings) {
    const tbody = document.getElementById('peminjamanTableBody');
    tbody.innerHTML = '';
    
    if (borrowings && borrowings.length > 0) {
        borrowings.forEach(borrowing => {
            const row = document.createElement('tr');
            const hasActiveBooks = borrowing.status_peminjaman && borrowing.status_peminjaman.includes('Dipinjam');
            const statusClass = hasActiveBooks ? 'status-aktif' : 'status-lunas';
            const statusText = hasActiveBooks ? 'Dipinjam' : 'Dikembalikan';
            
            row.innerHTML = `
                <td>${borrowing.id_peminjaman}</td>
                <td>${borrowing.nama_pelanggan}</td>
                <td>${borrowing.judul_buku || '-'}</td>
                <td>${formatDate(borrowing.tanggal_peminjaman)}</td>
                <td>${formatDate(borrowing.tenggat_peminjaman)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="action-buttons">
                    ${hasActiveBooks ? 
                        `<button class="btn btn-success" onclick="kembalikanBuku('${borrowing.id_peminjaman}')">Kembalikan</button>` : 
                        ''
                    }
                    <button class="btn" onclick="viewDetailPeminjaman('${borrowing.id_peminjaman}')">Detail</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data peminjaman</td></tr>';
    }
}

async function savePeminjaman(formData) {
    try {
        const peminjamanData = {
            id_pelanggan: formData.get('pelangganPeminjam'),
            isbn_buku: formData.get('bukuPeminjam'),
            tanggal_peminjaman: formData.get('tanggalPeminjaman'),
            tenggat_peminjaman: formData.get('tenggatPeminjaman')
        };
        
        const response = await fetch(`${API_BASE_URL}/api/peminjaman`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(peminjamanData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Peminjaman berhasil diproses!');
            loadPeminjaman();
            loadBuku(); // Refresh book list to update stock
            loadDashboard(); // Update dashboard stats
            resetPeminjamanForm();
        } else {
            showAlert(result.message || 'Error processing borrowing', 'error');
        }
    } catch (error) {
        console.error('Save peminjaman error:', error);
        showAlert('Error processing borrowing', 'error');
    }
}

async function kembalikanBuku(idPeminjaman) {
    if (!confirm('Konfirmasi pengembalian buku?')) return;
    
    try {
        // For simplicity, we'll use a generic detail ID
        // In real implementation, you'd fetch the actual detail peminjaman ID
        const response = await fetch(`${API_BASE_URL}/api/peminjaman/return`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                id_peminjaman: idPeminjaman
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Buku berhasil dikembalikan!');
            loadPeminjaman();
            loadBuku();
            loadDashboard();
        } else {
            showAlert(result.message || 'Error returning book', 'error');
        }
    } catch (error) {
        console.error('Return book error:', error);
        showAlert('Error returning book', 'error');
    }
}

function viewDetailPeminjaman(id) {
    showAlert('Detail peminjaman: ' + id);
}

function resetPeminjamanForm() {
    document.getElementById('peminjamanForm').reset();
    setTodayDate();
}

// Denda API Functions
async function loadDenda() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/denda`);
        const data = await response.json();
        
        if (response.ok) {
            displayDenda(data.records || []);
        } else {
            document.getElementById('dendaTableBody').innerHTML = 
                '<tr><td colspan="6" class="text-center">Tidak ada data denda</td></tr>';
        }
    } catch (error) {
        console.error('Denda load error:', error);
        showAlert('Error loading fines', 'error');
    }
}

function displayDenda(fines) {
    const tbody = document.getElementById('dendaTableBody');
    tbody.innerHTML = '';
    
    if (fines && fines.length > 0) {
        fines.forEach(fine => {
            const row = document.createElement('tr');
            const statusClass = fine.status_denda === 'Lunas' ? 'status-lunas' : 'status-belum-lunas';
            
            row.innerHTML = `
                <td>${fine.id_denda}</td>
                <td>${fine.nama_pelanggan}</td>
                <td>${fine.jumlah_hari_telat} hari</td>
                <td>${formatCurrency(fine.jumlah_denda)}</td>
                <td><span class="status-badge ${statusClass}">${fine.status_denda}</span></td>
                <td class="action-buttons">
                    ${fine.status_denda === 'Belum Lunas' ? 
                        `<button class="btn btn-success" onclick="bayarDenda('${fine.id_denda}')">Bayar</button>` : 
                        ''
                    }
                    <button class="btn" onclick="viewDetailDenda('${fine.id_denda}')">Detail</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada data denda</td></tr>';
    }
}

async function bayarDenda(idDenda) {
    const metode = prompt('Pilih metode pembayaran:\n1. Cash\n2. Qris\n3. Debit\n\nMasukkan nomor pilihan:');
    const metodePembayaran = ['', 'Cash', 'Qris', 'Debit'][parseInt(metode)];
    
    if (!metodePembayaran) {
        showAlert('Metode pembayaran tidak valid', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/denda/bayar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_denda: idDenda,
                metode_transaksi: metodePembayaran
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Pembayaran denda berhasil diproses!');
            loadDenda();
            loadDashboard(); // Update dashboard stats
        } else {
            showAlert(result.message || 'Error processing payment', 'error');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showAlert('Error processing payment', 'error');
    }
}

async function generateDendaOtomatis() {
    if (!confirm('Generate denda otomatis untuk semua peminjaman yang terlambat?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/denda/generate`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Denda otomatis berhasil digenerate!');
            loadDenda();
            loadDashboard();
        } else {
            showAlert(result.message || 'Error generating fines', 'error');
        }
    } catch (error) {
        console.error('Generate denda error:', error);
        showAlert('Error generating fines', 'error');
    }
}

function viewDetailDenda(id) {
    showAlert('Detail denda: ' + id);
}

// Membership API Functions
async function loadMembership() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/membership`);
        const data = await response.json();
        
        if (response.ok) {
            displayMembership(data.records || []);
        } else {
            document.getElementById('membershipTableBody').innerHTML = 
                '<tr><td colspan="7" class="text-center">Tidak ada data membership</td></tr>';
        }
    } catch (error) {
        console.error('Membership load error:', error);
        showAlert('Error loading membership records', 'error');
    }
}

function displayMembership(memberships) {
    const tbody = document.getElementById('membershipTableBody');
    tbody.innerHTML = '';
    
    if (memberships && memberships.length > 0) {
        memberships.forEach(membership => {
            const row = document.createElement('tr');
            const statusClass = membership.status_membership === 'Aktif' ? 'status-aktif' : 'status-tidak-tersedia';
            
            row.innerHTML = `
                <td>${membership.id_member}</td>
                <td>${membership.nama_pelanggan}</td>
                <td>${membership.paket_langganan}</td>
                <td>${formatDate(membership.tanggal_pembuatan)}</td>
                <td>${formatDate(membership.tanggal_expired)}</td>
                <td><span class="status-badge ${statusClass}">${membership.status_membership}</span></td>
                <td class="action-buttons">
                    <button class="btn" onclick="perpanjangMembership('${membership.id_member}')">Perpanjang</button>
                    <button class="btn" onclick="editMembership('${membership.id_member}')">Edit</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data membership</td></tr>';
    }
}

async function saveMembership(formData) {
    try {
        const membershipData = {
            id_pelanggan: formData.get('pelangganMember'),
            paket_langganan: formData.get('paketMembership'),
            nominal: parseInt(formData.get('nominalMembership')),
            metode_pembayaran: formData.get('metodePembayaran')
        };
        
        const response = await fetch(`${API_BASE_URL}/api/membership`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(membershipData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Membership berhasil diproses!');
            loadMembership();
            loadPelanggan(); // Refresh to update customer status
            loadDashboard();
            resetMembershipForm();
        } else {
            showAlert(result.message || 'Error processing membership', 'error');
        }
    } catch (error) {
        console.error('Save membership error:', error);
        showAlert('Error processing membership', 'error');
    }
}

function updateHargaMembership() {
    const paket = document.getElementById('paketMembership').value;
    const nominalInput = document.getElementById('nominalMembership');
    
    switch(paket) {
        case '1 Bulan':
            nominalInput.value = 50000;
            break;
        case '3 Bulan':
            nominalInput.value = 130000;
            break;
        case '6 Bulan':
            nominalInput.value = 250000;
            break;
        default:
            nominalInput.value = '';
    }
}

function perpanjangMembership(idMember) {
    showAlert('Perpanjang membership: ' + idMember);
}

function editMembership(id) {
    showAlert('Edit membership: ' + id);
}

function resetMembershipForm() {
    document.getElementById('membershipForm').reset();
    setTodayDate();
}

// Utility Functions
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
}

// Filter Functions
function filterPeminjamanStatus(status) {
    const rows = document.querySelectorAll('#peminjamanTableBody tr');
    rows.forEach(row => {
        if (status === '') {
            row.style.display = '';
        } else {
            const statusText = row.querySelector('.status-badge')?.textContent || '';
            row.style.display = statusText.includes(status) ? '' : 'none';
        }
    });
}

function filterDendaStatus(status) {
    const rows = document.querySelectorAll('#dendaTableBody tr');
    rows.forEach(row => {
        if (status === '') {
            row.style.display = '';
        } else {
            const statusText = row.querySelector('.status-badge')?.textContent || '';
            row.style.display = statusText.includes(status) ? '' : 'none';
        }
    });
}

function filterMembershipStatus(status) {
    const rows = document.querySelectorAll('#membershipTableBody tr');
    rows.forEach(row => {
        if (status === '') {
            row.style.display = '';
        } else {
            const statusText = row.querySelector('.status-badge')?.textContent || '';
            if (status === 'Expired') {
                row.style.display = !statusText.includes('Aktif') ? '' : 'none';
            } else {
                row.style.display = statusText.includes(status) ? '' : 'none';
            }
        }
    });
}

// Search Functions
function searchPeminjaman(query) {
    const rows = document.querySelectorAll('#peminjamanTableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
    });
}

function searchDenda(query) {
    const rows = document.querySelectorAll('#dendaTableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
    });
}

function searchMembership(query) {
    const rows = document.querySelectorAll('#membershipTableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
    });
}

// Initialize API integration
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date for all date inputs
    setTodayDate();
    
    // Load initial data
    loadDashboard();
    loadBuku();
    loadPelanggan();
    
    // Auto-calculate tenggat peminjaman (14 hari dari tanggal peminjaman)
    const tanggalPeminjamanInput = document.getElementById('tanggalPeminjaman');
    if (tanggalPeminjamanInput) {
        tanggalPeminjamanInput.addEventListener('change', function() {
            const tanggalPinjam = new Date(this.value);
            const tenggat = new Date(tanggalPinjam);
            tenggat.setDate(tenggat.getDate() + 14);
            document.getElementById('tenggatPeminjaman').value = tenggat.toISOString().split('T')[0];
        });
    }
    
    // Form submission handlers
    const bukuForm = document.getElementById('bukuForm');
    if (bukuForm) {
        bukuForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            saveBuku(formData);
        });
    }
    
    const pelangganForm = document.getElementById('pelangganForm');
    if (pelangganForm) {
        pelangganForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            savePelanggan(formData);
        });
    }
    
    const peminjamanForm = document.getElementById('peminjamanForm');
    if (peminjamanForm) {
        peminjamanForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            savePeminjaman(formData);
        });
    }
    
    const membershipForm = document.getElementById('membershipForm');
    if (membershipForm) {
        membershipForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            saveMembership(formData);
        });
    }
    
    // Search event listeners
    const bukuSearch = document.getElementById('bukuSearch');
    if (bukuSearch) {
        bukuSearch.addEventListener('keyup', function() {
            searchBuku(this.value);
        });
    }
    
    const pelangganSearch = document.getElementById('pelangganSearch');
    if (pelangganSearch) {
        pelangganSearch.addEventListener('keyup', function() {
            searchPelanggan(this.value);
        });
    }
    
    const peminjamanSearch = document.getElementById('peminjamanSearch');
    if (peminjamanSearch) {
        peminjamanSearch.addEventListener('keyup', function() {
            searchPeminjaman(this.value);
        });
    }
    
    const dendaSearch = document.getElementById('dendaSearch');
    if (dendaSearch) {
        dendaSearch.addEventListener('keyup', function() {
            searchDenda(this.value);
        });
    }
    
    const membershipSearch = document.getElementById('membershipSearch');
    if (membershipSearch) {
        membershipSearch.addEventListener('keyup', function() {
            searchMembership(this.value);
        });
    }
    
    // Filter event listeners
    const peminjamanStatusFilter = document.getElementById('peminjamanStatusFilter');
    if (peminjamanStatusFilter) {
        peminjamanStatusFilter.addEventListener('change', function() {
            filterPeminjamanStatus(this.value);
        });
    }
    
    const dendaStatusFilter = document.getElementById('dendaStatusFilter');
    if (dendaStatusFilter) {
        dendaStatusFilter.addEventListener('change', function() {
            filterDendaStatus(this.value);
        });
    }
    
    const membershipStatusFilter = document.getElementById('membershipStatusFilter');
    if (membershipStatusFilter) {
        membershipStatusFilter.addEventListener('change', function() {
            filterMembershipStatus(this.value);
        });
    }
    
    // Show connection status after 3 seconds
    setTimeout(() => {
        const totalBuku = document.getElementById('totalBuku');
        if (totalBuku && totalBuku.textContent === '-') {
            showAlert('Tidak dapat terhubung ke backend API. Pastikan server berjalan di ' + API_BASE_URL, 'error');
        }
    }, 3000);
});

// Add CSS for alert animations if not already present
if (!document.querySelector('style[data-api-styles]')) {
    const style = document.createElement('style');
    style.setAttribute('data-api-styles', 'true');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .text-center {
            text-align: center;
        }
        
        .error-message {
            color: #dc3545;
            font-size: 0.875rem;
            margin-top: 0.25rem;
        }
        
        .success-message {
            color: #28a745;
            font-size: 0.875rem;
            margin-top: 0.25rem;
        }
    `;
    document.head.appendChild(style);
}

// Export functions for global access (if needed)
window.libraryAPI = {
    loadDashboard,
    loadBuku,
    loadPelanggan,
    loadPeminjaman,
    loadDenda,
    loadMembership,
    saveBuku,
    savePelanggan,
    savePeminjaman,
    saveMembership,
    deleteBuku,
    bayarDenda,
    generateDendaOtomatis,
    kembalikanBuku,
    editBuku,
    editPelanggan,
    formatCurrency,
    formatDate,
    showAlert
};

// Error handling for network issues
window.addEventListener('online', function() {
    showAlert('Koneksi internet dipulihkan', 'success');
});

window.addEventListener('offline', function() {
    showAlert('Koneksi internet terputus', 'error');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showAlert('Terjadi kesalahan sistem. Silakan coba lagi.', 'error');
});

// Console message for developers
console.log('%c🚀 Library Management System API Integration Loaded', 'color: #667eea; font-size: 16px; font-weight: bold;');
console.log('%cAPI Base URL:', 'color: #666;', API_BASE_URL);
console.log('%cAvailable functions:', 'color: #666;', Object.keys(window.libraryAPI));

// Development helper functions
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.devTools = {
        testConnection: async function() {
            try {
                const response = await fetch(`${API_BASE_URL}/api/dashboard`);
                console.log('API Connection Test:', response.ok ? 'SUCCESS' : 'FAILED');
                console.log('Response status:', response.status);
                return response.ok;
            } catch (error) {
                console.error('API Connection Test FAILED:', error);
                return false;
            }
        },
        
        clearAllData: function() {
            if (confirm('WARNING: This will clear all form data. Continue?')) {
                document.querySelectorAll('form').forEach(form => form.reset());
                setTodayDate();
                console.log('All forms cleared');
            }
        },
        
        simulateError: function() {
            showAlert('This is a test error message', 'error');
        },
        
        simulateSuccess: function() {
            showAlert('This is a test success message', 'success');
        }
    };
    
    console.log('%cDevelopment tools available:', 'color: #28a745;', Object.keys(window.devTools));
    console.log('%cUsage: devTools.testConnection()', 'color: #666;');
}