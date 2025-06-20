// js/api.js - API Integration Layer
class ApiClient {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.timeout = CONFIG.CONNECTION_TIMEOUT;
        this.retryAttempts = CONFIG.RETRY_ATTEMPTS;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (CONFIG.DEBUG) {
            console.log(`🚀 API Request: ${config.method || 'GET'} ${url}`);
            if (config.body) {
                console.log('📤 Request Body:', JSON.parse(config.body));
            }
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (CONFIG.DEBUG) {
                console.log(`📥 API Response: ${response.status}`, data);
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP Error: ${response.status}`);
            }

            return { success: true, data, status: response.status };
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message, status: 0 };
        }
    }

    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            body: JSON.stringify(data)
        });
    }
}

// Initialize API client
const api = new ApiClient();

// Dashboard API
class DashboardAPI {
    static async getStats() {
        const cacheKey = 'dashboard-stats';
        const cached = CacheManager.get(cacheKey);
        if (cached) return { success: true, data: cached };

        const result = await api.get(CONFIG.ENDPOINTS.DASHBOARD);
        if (result.success) {
            CacheManager.set(cacheKey, result.data, 2); // Cache for 2 minutes
        }
        return result;
    }

    static async load() {
        try {
            const result = await this.getStats();
            if (result.success) {
                this.updateStats(result.data.stats);
                this.updateActivities(result.data.activities);
                return true;
            } else {
                AlertManager.error(CONFIG.MESSAGES.ERROR.SERVER_ERROR);
                return false;
            }
        } catch (error) {
            console.error('Dashboard load error:', error);
            AlertManager.error(CONFIG.MESSAGES.ERROR.CONNECTION_FAILED);
            return false;
        }
    }

    static updateStats(stats) {
        const elements = {
            totalBuku: stats.total_buku || 0,
            totalPelanggan: stats.total_pelanggan || 0,
            bukuDipinjam: stats.buku_dipinjam || 0,
            dendaBelumLunas: stats.denda_belum_lunas || 0
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                // Animate number change
                this.animateNumber(element, parseInt(element.textContent) || 0, value);
            }
        });
    }

    static updateActivities(activities) {
        const tbody = document.getElementById('activitiesTableBody');
        if (!tbody) return;

        if (!activities || activities.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Tidak ada aktivitas terbaru</td></tr>';
            return;
        }

        tbody.innerHTML = activities.map(activity => `
            <tr>
                <td>${Utils.formatDate(activity.tanggal)}</td>
                <td>${activity.type}</td>
                <td>${activity.detail}</td>
                <td>${Utils.createStatusBadge(activity.status, CONFIG.FINE_STATUS).outerHTML}</td>
            </tr>
        `).join('');
    }

    static animateNumber(element, start, end, duration = 1000) {
        const startTime = performance.now();
        const difference = end - start;

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (difference * progress));
            
            element.textContent = current.toLocaleString('id-ID');
            
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }
}

// Book API
class BookAPI {
    static async getAll(searchQuery = '') {
        const params = searchQuery ? { search: searchQuery } : {};
        return await api.get(CONFIG.ENDPOINTS.BUKU, params);
    }

    static async create(bookData) {
        return await api.post(CONFIG.ENDPOINTS.BUKU, bookData);
    }

    static async update(bookData) {
        return await api.put(CONFIG.ENDPOINTS.BUKU, bookData);
    }

    static async delete(isbn) {
        return await api.delete(CONFIG.ENDPOINTS.BUKU, { isbn_buku: isbn });
    }

    static async load(searchQuery = '') {
        const tbody = document.getElementById('bukuTableBody');
        if (!tbody) return;

        Utils.showLoading(tbody);

        try {
            const result = await this.getAll(searchQuery);
            
            if (result.success) {
                this.displayBooks(result.data.records || []);
                this.updateBookDropdown(result.data.records || []);
                CacheManager.delete('dashboard-stats'); // Invalidate dashboard cache
            } else {
                Utils.showError(tbody, result.error);
            }
        } catch (error) {
            console.error('Books load error:', error);
            Utils.showError(tbody);
        }
    }

    static displayBooks(books) {
        const tbody = document.getElementById('bukuTableBody');
        if (!books || books.length === 0) {
            Utils.showEmpty(tbody, 'Tidak ada data buku');
            return;
        }

        tbody.innerHTML = books.map(book => {
            const statusConfig = CONFIG.BOOK_STATUS.find(s => s.value === book.status_buku);
            const statusClass = statusConfig ? statusConfig.class : '';

            return `
                <tr>
                    <td>${book.isbn_buku}</td>
                    <td title="${book.judul_buku}">${Utils.truncate(book.judul_buku, 40)}</td>
                    <td>${book.penulis || '-'}</td>
                    <td>
                        <span class="badge badge-category">${book.kategori}</span>
                    </td>
                    <td>
                        <span class="stock-indicator ${book.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                            ${book.stock}
                        </span>
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">${book.status_buku}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary" onclick="BookAPI.edit('${book.isbn_buku}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="BookAPI.confirmDelete('${book.isbn_buku}')" title="Hapus">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    static updateBookDropdown(books) {
        const dropdown = document.getElementById('bukuPeminjam');
        if (!dropdown) return;

        const availableBooks = books.filter(book => 
            book.status_buku === 'Tersedia' && book.stock > 0
        );

        dropdown.innerHTML = '<option value="">Pilih Buku</option>' + 
            availableBooks.map(book => 
                `<option value="${book.isbn_buku}">${Utils.truncate(book.judul_buku, 50)} (Stok: ${book.stock})</option>`
            ).join('');
    }

    static async save(formElement) {
        const formData = Utils.getFormData(formElement);
        const isEdit = !!formElement.dataset.editMode;

        // Validate form
        const validation = Utils.validateForm(formElement, {
            isbn: { required: true, minLength: 10, maxLength: 17 },
            judulBuku: { required: true, minLength: 1, maxLength: 100 },
            kategori: { required: true },
            stock: { required: true, positiveNumber: true },
            statusBuku: { required: true }
        });

        if (!validation.isValid) {
            AlertManager.error('Mohon perbaiki kesalahan pada form');
            return;
        }

        const submitBtn = document.getElementById('bukuSubmitBtn');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

            const bookData = {
                isbn_buku: formData.isbn,
                judul_buku: formData.judulBuku,
                penulis: formData.penulis || '',
                penerbit: formData.penerbit || '',
                tahun_terbit: formData.tahunTerbit || null,
                kategori: formData.kategori,
                stock: parseInt(formData.stock),
                status_buku: formData.statusBuku
            };

            const result = isEdit ? 
                await this.update(bookData) : 
                await this.create(bookData);

            if (result.success) {
                AlertManager.success(
                    isEdit ? CONFIG.MESSAGES.SUCCESS.BOOK_UPDATED : CONFIG.MESSAGES.SUCCESS.BOOK_CREATED
                );
                this.resetForm();
                this.load();
            } else {
                AlertManager.error(result.error || CONFIG.MESSAGES.ERROR.SERVER_ERROR);
            }
        } catch (error) {
            console.error('Save book error:', error);
            AlertManager.error(CONFIG.MESSAGES.ERROR.CONNECTION_FAILED);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    static edit(isbn) {
        // In a real implementation, fetch book details first
        AlertManager.info('Fitur edit akan segera tersedia');
    }

    static confirmDelete(isbn) {
        ModalManager.confirm(
            'Konfirmasi Hapus',
            CONFIG.MESSAGES.CONFIRM.DELETE_BOOK,
            () => this.delete(isbn),
            () => {} // Cancel action
        );
    }

    static async deleteBook(isbn) {
        try {
            LoadingManager.show('Menghapus buku...');
            
            const result = await this.delete(isbn);
            
            if (result.success) {
                AlertManager.success(CONFIG.MESSAGES.SUCCESS.BOOK_DELETED);
                this.load();
            } else {
                AlertManager.error(result.error || CONFIG.MESSAGES.ERROR.SERVER_ERROR);
            }
        } catch (error) {
            console.error('Delete book error:', error);
            AlertManager.error(CONFIG.MESSAGES.ERROR.CONNECTION_FAILED);
        } finally {
            LoadingManager.hide();
        }
    }

    static resetForm() {
        const form = document.getElementById('bukuForm');
        if (form) {
            Utils.resetForm(form);
            form.removeAttribute('data-edit-mode');
            document.getElementById('bukuSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Simpan Buku';
        }
    }

    static search(query) {
        // Debounce search to avoid too many requests
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.load(query);
        }, 300);
    }
}

// Customer API
class CustomerAPI {
    static async getAll(searchQuery = '') {
        const params = searchQuery ? { search: searchQuery } : {};
        return await api.get(CONFIG.ENDPOINTS.PELANGGAN, params);
    }

    static async create(customerData) {
        return await api.post(CONFIG.ENDPOINTS.PELANGGAN, customerData);
    }

    static async load(searchQuery = '') {
        const tbody = document.getElementById('pelangganTableBody');
        if (!tbody) return;

        Utils.showLoading(tbody);

        try {
            const result = await this.getAll(searchQuery);
            
            if (result.success) {
                this.displayCustomers(result.data.records || []);
                this.updateCustomerDropdowns(result.data.records || []);
                CacheManager.delete('dashboard-stats');
            } else {
                Utils.showError(tbody, result.error);
            }
        } catch (error) {
            console.error('Customers load error:', error);
            Utils.showError(tbody);
        }
    }

    static displayCustomers(customers) {
        const tbody = document.getElementById('pelangganTableBody');
        if (!customers || customers.length === 0) {
            Utils.showEmpty(tbody, 'Tidak ada data pelanggan');
            return;
        }

        tbody.innerHTML = customers.map(customer => {
            const statusConfig = CONFIG.MEMBERSHIP_STATUS.find(s => s.value === customer.status_membership);
            const statusClass = statusConfig ? statusConfig.class : '';

            return `
                <tr>
                    <td><span class="id-badge">${customer.id_pelanggan}</span></td>
                    <td>${customer.nama}</td>
                    <td title="${customer.alamat}">${Utils.truncate(customer.alamat || '-', 30)}</td>
                    <td>${customer.no_telp || '-'}</td>
                    <td>${customer.email || '-'}</td>
                    <td>
                        <span class="status-badge ${statusClass}">${customer.status_membership}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary" onclick="CustomerAPI.edit('${customer.id_pelanggan}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="CustomerAPI.confirmDelete('${customer.id_pelanggan}')" title="Hapus">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    static updateCustomerDropdowns(customers) {
        const dropdowns = ['pelangganPeminjam', 'pelangganMember'];
        
        dropdowns.forEach(dropdownId => {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                dropdown.innerHTML = '<option value="">Pilih Pelanggan</option>' + 
                    customers.map(customer => 
                        `<option value="${customer.id_pelanggan}">${customer.nama}</option>`
                    ).join('');
            }
        });
    }

    static async save(formElement) {
        const formData = Utils.getFormData(formElement);

        // Validate form
        const validation = Utils.validateForm(formElement, {
            namaPelanggan: { required: true, minLength: 2, maxLength: 100 },
            email: { email: true },
            noTelp: { phone: true }
        });

        if (!validation.isValid) {
            AlertManager.error('Mohon perbaiki kesalahan pada form');
            return;
        }

        const submitBtn = document.getElementById('pelangganSubmitBtn');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

            const customerData = {
                nama: formData.namaPelanggan,
                alamat: formData.alamat || '',
                no_telp: formData.noTelp || '',
                email: formData.email || ''
            };

            const result = await this.create(customerData);

            if (result.success) {
                AlertManager.success(CONFIG.MESSAGES.SUCCESS.CUSTOMER_CREATED);
                this.resetForm();
                this.load();
            } else {
                AlertManager.error(result.error || CONFIG.MESSAGES.ERROR.SERVER_ERROR);
            }
        } catch (error) {
            console.error('Save customer error:', error);
            AlertManager.error(CONFIG.MESSAGES.ERROR.CONNECTION_FAILED);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    static edit(id) {
        AlertManager.info('Fitur edit akan segera tersedia');
    }

    static confirmDelete(id) {
        ModalManager.confirm(
            'Konfirmasi Hapus',
            CONFIG.MESSAGES.CONFIRM.DELETE_CUSTOMER,
            () => this.deleteCustomer(id),
            () => {}
        );
    }

    static async deleteCustomer(id) {
        AlertManager.info('Fitur hapus akan segera tersedia');
    }

    static resetForm() {
        const form = document.getElementById('pelangganForm');
        if (form) {
            Utils.resetForm(form);
        }
    }

    static search(query) {
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.load(query);
        }, 300);
    }
}

// Borrowing API
class BorrowingAPI {
    static async getAll() {
        return await api.get(CONFIG.ENDPOINTS.PEMINJAMAN);
    }

    static async create(borrowingData) {
        return await api.post(CONFIG.ENDPOINTS.PEMINJAMAN, borrowingData);
    }

    static async returnBook(id) {
        return await api.put(CONFIG.ENDPOINTS.PEMINJAMAN_RETURN, { id_peminjaman: id });
    }

    static async load() {
        const tbody = document.getElementById('peminjamanTableBody');
        if (!tbody) return;

        Utils.showLoading(tbody);

        try {
            const result = await this.getAll();
            
            if (result.success) {
                this.displayBorrowings(result.data.records || []);
                CacheManager.delete('dashboard-stats');
            } else {
                Utils.showError(tbody, result.error);
            }
        } catch (error) {
            console.error('Borrowings load error:', error);
            Utils.showError(tbody);
        }
    }

    static displayBorrowings(borrowings) {
        const tbody = document.getElementById('peminjamanTableBody');
        if (!borrowings || borrowings.length === 0) {
            Utils.showEmpty(tbody, 'Tidak ada data peminjaman');
            return;
        }

        tbody.innerHTML = borrowings.map(borrowing => {
            const hasActiveBooks = borrowing.status_peminjaman && borrowing.status_peminjaman.includes('Dipinjam');
            const statusClass = hasActiveBooks ? 'status-aktif' : 'status-lunas';
            const statusText = hasActiveBooks ? 'Dipinjam' : 'Dikembalikan';

            return `
                <tr>
                    <td><span class="id-badge">${borrowing.id_peminjaman}</span></td>
                    <td>${borrowing.nama_pelanggan}</td>
                    <td title="${borrowing.judul_buku}">${Utils.truncate(borrowing.judul_buku || '-', 40)}</td>
                    <td>${Utils.formatDate(borrowing.tanggal_peminjaman)}</td>
                    <td>${Utils.formatDate(borrowing.tenggat_peminjaman)}</td>
                    <td>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            ${hasActiveBooks ? 
                                `<button class="btn btn-sm btn-success" onclick="BorrowingAPI.confirmReturn('${borrowing.id_peminjaman}')" title="Kembalikan">
                                    <i class="fas fa-undo"></i>
                                </button>` : 
                                ''
                            }
                            <button class="btn btn-sm btn-info" onclick="BorrowingAPI.viewDetail('${borrowing.id_peminjaman}')" title="Detail">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    static async save(formElement) {
        const formData = Utils.getFormData(formElement);

        // Validate form
        const validation = Utils.validateForm(formElement, {
            pelangganPeminjam: { required: true },
            bukuPeminjam: { required: true },
            tanggalPeminjaman: { required: true },
            tenggatPeminjaman: { required: true }
        });

        if (!validation.isValid) {
            AlertManager.error('Mohon lengkapi semua field yang wajib diisi');
            return;
        }

        const submitBtn = document.getElementById('peminjamanSubmitBtn');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

            const borrowingData = {
                id_pelanggan: formData.pelangganPeminjam,
                isbn_buku: formData.bukuPeminjam,
                tanggal_peminjaman: formData.tanggalPeminjaman,
                tenggat_peminjaman: formData.tenggatPeminjaman
            };

            const result = await this.create(borrowingData);

            if (result.success) {
                AlertManager.success(CONFIG.MESSAGES.SUCCESS.BORROWING_CREATED);
                this.resetForm();
                this.load();
                BookAPI.load(); // Refresh book list
                DashboardAPI.load(); // Refresh dashboard
            } else {
                AlertManager.error(result.error || CONFIG.MESSAGES.ERROR.SERVER_ERROR);
            }
        } catch (error) {
            console.error('Save borrowing error:', error);
            AlertManager.error(CONFIG.MESSAGES.ERROR.CONNECTION_FAILED);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    static confirmReturn(id) {
        ModalManager.confirm(
            'Konfirmasi Pengembalian',
            CONFIG.MESSAGES.CONFIRM.RETURN_BOOK,
            () => this.processReturn(id),
            () => {}
        );
    }

    static async processReturn(id) {
        try {
            LoadingManager.show('Memproses pengembalian...');
            
            const result = await this.returnBook(id);

            if (result.success) {
                AlertManager.success(CONFIG.MESSAGES.SUCCESS.BOOK_RETURNED);
                this.load();
                BookAPI.load();
                DashboardAPI.load();
            } else {
                AlertManager.error(result.error || CONFIG.MESSAGES.ERROR.SERVER_ERROR);
            }
        } catch (error) {
            console.error('Return book error:', error);
            AlertManager.error(CONFIG.MESSAGES.ERROR.CONNECTION_FAILED);
        } finally {
            LoadingManager.hide();
        }
    }

    static viewDetail(id) {
        AlertManager.info('Detail peminjaman: ' + id);
    }

    static resetForm() {
        const form = document.getElementById('peminjamanForm');
        if (form) {
            Utils.resetForm(form);
            // Set today's date
            const today = Utils.getTodayString();
            const tanggalInput = document.getElementById('tanggalPeminjaman');
            const tenggatInput = document.getElementById('tenggatPeminjaman');
            
            if (tanggalInput) tanggalInput.value = today;
            if (tenggatInput) tenggatInput.value = Utils.addDays(today, CONFIG.BORROWING_DURATION_DAYS);
        }
    }
}

// Fine API
class FineAPI {
    static async getAll() {
        return await api.get(CONFIG.ENDPOINTS.DENDA);
    }

    static async pay(fineId, paymentMethod) {
        return await api.post(CONFIG.ENDPOINTS.DENDA_BAYAR, {
            id_denda: fineId,
            metode_transaksi: paymentMethod
        });
    }

    static async generateAutomatic() {
        return await api.post(CONFIG.ENDPOINTS.DENDA_GENERATE);
    }

    static async load() {
        const tbody = document.getElementById('dendaTableBody');
        if (!tbody) return;

        Utils.showLoading(tbody);

        try {
            const result = await this.getAll();
            
            if (result.success) {
                this.displayFines(result.data.records || []);
                CacheManager.delete('dashboard-stats');
            } else {
                Utils.showError(tbody, result.error);
            }
        } catch (error) {
            console.error('Fines load error:', error);
            Utils.showError(tbody);
        }
    }

    static displayFines(fines) {
        const tbody = document.getElementById('dendaTableBody');
        if (!fines || fines.length === 0) {
            Utils.showEmpty(tbody, 'Tidak ada data denda');
            return;
        }

        tbody.innerHTML = fines.map(fine => {
            const statusConfig = CONFIG.FINE_STATUS.find(s => s.value === fine.status_denda);
            const statusClass = statusConfig ? statusConfig.class : '';

            return `
                <tr>
                    <td><span class="id-badge">${fine.id_denda}</span></td>
                    <td>${fine.nama_pelanggan}</td>
                    <td>
                        <span class="days-late">${fine.jumlah_hari_telat} hari</span>
                    </td>
                    <td>
                        <span class="amount">${Utils.formatCurrency(fine.jumlah_denda)}</span>
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">${fine.status_denda}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            ${fine.status_denda === 'Belum Lunas' ? 
                                `<button class="btn btn-sm btn-success" onclick="FineAPI.showPaymentModal('${fine.id_denda}')" title="Bayar">
                                    <i class="fas fa-money-bill"></i>
                                </button>` : 
                                ''
                            }
                            <button class="btn btn-sm btn-info" onclick="FineAPI.viewDetail('${fine.id_denda}')" title="Detail">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    static showPaymentModal(fineId) {
        const paymentOptions = CONFIG.PAYMENT_METHODS.map(method => `
            <label class="payment-option">
                <input type="radio" name="paymentMethod" value="${method.value}">
                <i class="${method.icon}"></i>
                ${method.label}
            </label>
        `).join('');

        const content = `
            <div class="payment-form">
                <p>Pilih metode pembayaran:</p>
                <div class="payment-options">
                    ${paymentOptions}
                </div>
            </div>
        `;

        ModalManager.create('Pembayaran Denda', content, [
            {
                text: 'Batal',
                className: 'btn btn-secondary'
            },
            {
                text: 'Bayar',
                className: 'btn btn-success',
                onClick: () => {
                    const selected = document.querySelector('input[name="paymentMethod"]:checked');
                    if (selected) {
                        this.processPay(fineId, selected.value);
                        return true; // Close modal
                    } else {
                        AlertManager.error('Pilih metode pembayaran');
                        return false; // Keep modal open
                    }
                }
            }
        ]);
    }

    static async processPay(fineId, paymentMethod) {
        try {
            LoadingManager.show('Memproses pembayaran...');
            
            const result = await this.pay(fineId, paymentMethod);

            if (result.success) {
                AlertManager.success(CONFIG.MESSAGES.SUCCESS.FINE_PAID);
                this.load();
                DashboardAPI.load();
            } else {
                AlertManager.error(result.error || CONFIG.MESSAGES.ERROR.SERVER_ERROR);
            }
        } catch (error) {
            console.error('Pay fine error:', error);
            AlertManager.error(CONFIG.MESSAGES.ERROR.CONNECTION_FAILED);
        } finally {
            LoadingManager.hide();
        }
    }

    static async generateAuto() {
        try {
            LoadingManager.show('Generating denda otomatis...');
            
            const result = await this.generateAutomatic();

            if (result.success) {
                AlertManager.success(CONFIG.MESSAGES.SUCCESS.FINE_GENERATED);
                this.load();
                DashboardAPI.load();
            } else {
                AlertManager.error(result.error || CONFIG.MESSAGES.ERROR.SERVER_ERROR);
            }
        } catch (error) {
            console.error('Generate fine error:', error);
            AlertManager.error(CONFIG.MESSAGES.ERROR.CONNECTION_FAILED);
        } finally {
            LoadingManager.hide();
        }
    }

    static viewDetail(id) {
        AlertManager.info('Detail denda: ' + id);
    }
}

// Membership API
class MembershipAPI {
    static async getAll() {
        return await api.get(CONFIG.ENDPOINTS.MEMBERSHIP);
    }

    static async create(membershipData) {
        return await api.post(CONFIG.ENDPOINTS.MEMBERSHIP, membershipData);
    }

    static async load() {
        const tbody = document.getElementById('membershipTableBody');
        if (!tbody) return;

        Utils.showLoading(tbody);

        try {
            const result = await this.getAll();
            
            if (result.success) {
                this.displayMemberships(result.data.records || []);
                CacheManager.delete('dashboard-stats');
            } else {
                Utils.showError(tbody, result.error);
            }
        } catch (error) {
            console.error('Memberships load error:', error);
            Utils.showError(tbody);
        }
    }

    static displayMemberships(memberships) {
        const tbody = document.getElementById('membershipTableBody');
        if (!memberships || memberships.length === 0) {
            Utils.showEmpty(tbody, 'Tidak ada data membership');
            return;
        }

        tbody.innerHTML = memberships.map(membership => {
            const isActive = membership.status_membership === 'Aktif';
            const statusClass = isActive ? 'status-aktif' : 'status-tidak-tersedia';

            return `
                <tr>
                    <td><span class="id-badge">${membership.id_member}</span></td>
                    <td>${membership.nama_pelanggan}</td>
                    <td>
                        <span class="package-badge">${membership.paket_langganan}</span>
                    </td>
                    <td>${Utils.formatDate(membership.tanggal_pembuatan)}</td>
                    <td>${Utils.formatDate(membership.tanggal_expired)}</td>
                    <td>
                        <span class="status-badge ${statusClass}">${membership.status_membership}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-warning" onclick="MembershipAPI.extend('${membership.id_member}')" title="Perpanjang">
                                <i class="fas fa-plus-circle"></i>
                            </button>
                            <button class="btn btn-sm btn-info" onclick="MembershipAPI.viewDetail('${membership.id_member}')" title="Detail">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    static async save(formElement) {
        const formData = Utils.getFormData(formElement);

        // Validate form
        const validation = Utils.validateForm(formElement, {
            pelangganMember: { required: true },
            paketMembership: { required: true },
            metodePembayaran: { required: true },
            nominalMembership: { required: true, positiveNumber: true }
        });

        if (!validation.isValid) {
            AlertManager.error('Mohon lengkapi semua field yang wajib diisi');
            return;
        }

        const submitBtn = document.getElementById('membershipSubmitBtn');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

            const membershipData = {
                id_pelanggan: formData.pelangganMember,
                paket_langganan: formData.paketMembership,
                nominal: parseInt(formData.nominalMembership),
                metode_pembayaran: formData.metodePembayaran
            };

            const result = await this.create(membershipData);

            if (result.success) {
                AlertManager.success(CONFIG.MESSAGES.SUCCESS.MEMBERSHIP_CREATED);
                this.resetForm();
                this.load();
                CustomerAPI.load(); // Refresh customer status
                DashboardAPI.load();
            } else {
                AlertManager.error(result.error || CONFIG.MESSAGES.ERROR.SERVER_ERROR);
            }
        } catch (error) {
            console.error('Save membership error:', error);
            AlertManager.error(CONFIG.MESSAGES.ERROR.CONNECTION_FAILED);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    static extend(id) {
        AlertManager.info('Perpanjang membership: ' + id);
    }

    static viewDetail(id) {
        AlertManager.info('Detail membership: ' + id);
    }

    static resetForm() {
        const form = document.getElementById('membershipForm');
        if (form) {
            Utils.resetForm(form);
            const today = Utils.getTodayString();
            const tanggalInput = document.getElementById('tanggalMulai');
            if (tanggalInput) tanggalInput.value = today;
        }
    }

    static updatePrice() {
        const paketSelect = document.getElementById('paketMembership');
        const nominalInput = document.getElementById('nominalMembership');
        
        if (paketSelect && nominalInput) {
            const selectedPackage = paketSelect.value;
            const packageConfig = CONFIG.MEMBERSHIP_PACKAGES[selectedPackage];
            nominalInput.value = packageConfig ? packageConfig.price : '';
        }
    }
}

// Global API functions for backward compatibility and direct calls
window.loadDashboard = () => DashboardAPI.load();
window.loadBuku = (query) => BookAPI.load(query);
window.loadPelanggan = (query) => CustomerAPI.load(query);
window.loadPeminjaman = () => BorrowingAPI.load();
window.loadDenda = () => FineAPI.load();
window.loadMembership = () => MembershipAPI.load();

window.searchBuku = (query) => BookAPI.search(query);
window.searchPelanggan = (query) => CustomerAPI.search(query);

window.resetBukuForm = () => BookAPI.resetForm();
window.resetPelangganForm = () => CustomerAPI.resetForm();
window.resetPeminjamanForm = () => BorrowingAPI.resetForm();
window.resetMembershipForm = () => MembershipAPI.resetForm();

window.generateDendaOtomatis = () => {
    ModalManager.confirm(
        'Generate Denda Otomatis',
        CONFIG.MESSAGES.CONFIRM.GENERATE_FINE,
        () => FineAPI.generateAuto(),
        () => {}
    );
};

window.updateHargaMembership = () => MembershipAPI.updatePrice();

// Export APIs
window.BookAPI = BookAPI;
window.CustomerAPI = CustomerAPI;
window.BorrowingAPI = BorrowingAPI;
window.FineAPI = FineAPI;
window.MembershipAPI = MembershipAPI;
window.DashboardAPI = DashboardAPI;

if (CONFIG.DEBUG) {
    console.log('🔌 API integration loaded successfully');
}