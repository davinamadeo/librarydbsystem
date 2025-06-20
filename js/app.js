// js/app.js - Main Application Controller
class LibraryApp {
    constructor() {
        this.currentTab = 'dashboard';
        this.isInitialized = false;
        this.connectionStatus = true;
    }

    async init() {
        if (this.isInitialized) return;

        try {
            console.log('🚀 Initializing Library Management System...');
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up connection monitoring
            this.setupConnectionMonitoring();
            
            // Set today's date for all date inputs
            this.setTodayDates();
            
            // Load initial data
            await this.loadInitialData();
            
            // Setup periodic refresh
            this.setupPeriodicRefresh();
            
            this.isInitialized = true;
            
            console.log('✅ Application initialized successfully');
            
            // Show welcome message if first time
            if (!Utils.getSessionData('welcomed')) {
                setTimeout(() => {
                    AlertManager.info(`Selamat datang di ${CONFIG.APP_NAME}!`);
                    Utils.setSessionData('welcomed', true);
                }, 1000);
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            AlertManager.error('Gagal memuat aplikasi. Silakan refresh halaman.');
        }
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Form submissions
        this.setupFormHandlers();
        
        // Search handlers
        this.setupSearchHandlers();
        
        // Filter handlers
        this.setupFilterHandlers();
        
        // Auto-calculate handlers
        this.setupAutoCalculateHandlers();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    setupFormHandlers() {
        const forms = [
            { id: 'bukuForm', handler: (e) => this.handleFormSubmit(e, BookAPI.save) },
            { id: 'pelangganForm', handler: (e) => this.handleFormSubmit(e, CustomerAPI.save) },
            { id: 'peminjamanForm', handler: (e) => this.handleFormSubmit(e, BorrowingAPI.save) },
            { id: 'membershipForm', handler: (e) => this.handleFormSubmit(e, MembershipAPI.save) }
        ];

        forms.forEach(({ id, handler }) => {
            const form = document.getElementById(id);
            if (form) {
                form.addEventListener('submit', handler);
            }
        });
    }

    setupSearchHandlers() {
        const searchInputs = [
            { id: 'bukuSearch', handler: Utils.debounce((e) => BookAPI.search(e.target.value), 300) },
            { id: 'pelangganSearch', handler: Utils.debounce((e) => CustomerAPI.search(e.target.value), 300) },
            { id: 'peminjamanSearch', handler: Utils.debounce((e) => this.filterTable('peminjamanTableBody', e.target.value), 300) },
            { id: 'dendaSearch', handler: Utils.debounce((e) => this.filterTable('dendaTableBody', e.target.value), 300) },
            { id: 'membershipSearch', handler: Utils.debounce((e) => this.filterTable('membershipTableBody', e.target.value), 300) }
        ];

        searchInputs.forEach(({ id, handler }) => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', handler);
            }
        });
    }

    setupFilterHandlers() {
        const filters = [
            { id: 'peminjamanStatusFilter', handler: (e) => this.filterTableByStatus('peminjamanTableBody', e.target.value) },
            { id: 'dendaStatusFilter', handler: (e) => this.filterTableByStatus('dendaTableBody', e.target.value) },
            { id: 'membershipStatusFilter', handler: (e) => this.filterTableByStatus('membershipTableBody', e.target.value) }
        ];

        filters.forEach(({ id, handler }) => {
            const filter = document.getElementById(id);
            if (filter) {
                filter.addEventListener('change', handler);
            }
        });
    }

    setupAutoCalculateHandlers() {
        // Auto-calculate due date for borrowing
        const tanggalPeminjamanInput = document.getElementById('tanggalPeminjaman');
        if (tanggalPeminjamanInput) {
            tanggalPeminjamanInput.addEventListener('change', (e) => {
                const tenggatInput = document.getElementById('tenggatPeminjaman');
                if (tenggatInput && e.target.value) {
                    tenggatInput.value = Utils.addDays(e.target.value, CONFIG.BORROWING_DURATION_DAYS);
                }
            });
        }

        // Auto-calculate membership price
        const paketMembershipSelect = document.getElementById('paketMembership');
        if (paketMembershipSelect) {
            paketMembershipSelect.addEventListener('change', () => {
                MembershipAPI.updatePrice();
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + number for tab switching
            if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '6') {
                e.preventDefault();
                const tabs = ['dashboard', 'buku', 'pelanggan', 'peminjaman', 'denda', 'membership'];
                const tabIndex = parseInt(e.key) - 1;
                if (tabs[tabIndex]) {
                    this.switchTab(tabs[tabIndex]);
                }
            }
            
            // Escape key to close modals/alerts
            if (e.key === 'Escape') {
                AlertManager.removeAll();
                ModalManager.removeAll();
            }
            
            // Ctrl/Cmd + R for refresh current tab data
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.refreshCurrentTab();
            }
        });
    }

    setupConnectionMonitoring() {
        window.addEventListener('online', () => {
            this.connectionStatus = true;
            AlertManager.success(CONFIG.MESSAGES.INFO.CONNECTION_RESTORED);
            this.refreshCurrentTab();
        });

        window.addEventListener('offline', () => {
            this.connectionStatus = false;
            AlertManager.error(CONFIG.MESSAGES.INFO.CONNECTION_LOST);
        });

        // Test connection periodically
        setInterval(() => {
            this.testConnection();
        }, 30000); // Every 30 seconds
    }

    async testConnection() {
        try {
            await fetch(`${CONFIG.API_BASE_URL}/api/dashboard`, { 
                method: 'GET',
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            
            if (!this.connectionStatus) {
                this.connectionStatus = true;
                AlertManager.success(CONFIG.MESSAGES.INFO.CONNECTION_RESTORED);
            }
        } catch (error) {
            if (this.connectionStatus) {
                this.connectionStatus = false;
                AlertManager.error(CONFIG.MESSAGES.ERROR.CONNECTION_FAILED);
            }
        }
    }

    setupPeriodicRefresh() {
        // Refresh dashboard every 5 minutes
        setInterval(() => {
            if (this.currentTab === 'dashboard' && this.connectionStatus) {
                DashboardAPI.load();
            }
        }, 5 * 60 * 1000);
        
        // Refresh overdue items every 10 minutes
        setInterval(() => {
            if (this.connectionStatus) {
                this.checkOverdueItems();
            }
        }, 10 * 60 * 1000);
    }

    setTodayDates() {
        const today = new Date().toISOString().split('T')[0];
        const dateInputs = document.querySelectorAll('input[type="date"]');
        
        dateInputs.forEach(input => {
            if (!input.value && input.dataset.setToday !== 'false') {
                input.value = today;
            }
        });
    }

    async loadInitialData() {
        try {
            // Load dashboard data first
            await DashboardAPI.load();
            
            // Load other data based on current tab
            await this.refreshCurrentTab();
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            AlertManager.error('Gagal memuat data awal. Beberapa fitur mungkin tidak berfungsi.');
        }
    }

    async handleFormSubmit(event, apiMethod) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate required fields
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });
        
        if (!isValid) {
            AlertManager.error('Mohon lengkapi semua field yang diperlukan.');
            return;
        }
        
        try {
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Menyimpan...';
            
            // Call API method
            const result = await apiMethod(data);
            
            if (result.success) {
                AlertManager.success(result.message || 'Data berhasil disimpan!');
                form.reset();
                this.setTodayDates(); // Reset date fields to today
                await this.refreshCurrentTab();
            } else {
                AlertManager.error(result.message || 'Gagal menyimpan data.');
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            AlertManager.error('Terjadi kesalahan saat menyimpan data.');
        } finally {
            // Restore button state
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    switchTab(tabName) {
        if (tabName === this.currentTab) return;
        
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab
        const targetTab = document.getElementById(`${tabName}Tab`);
        const targetNavTab = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (targetTab && targetNavTab) {
            targetTab.classList.add('active');
            targetNavTab.classList.add('active');
            this.currentTab = tabName;
            
            // Load tab data
            this.refreshCurrentTab();
            
            // Update URL hash
            window.location.hash = tabName;
        }
    }

    async refreshCurrentTab() {
        if (!this.connectionStatus) return;
        
        try {
            switch (this.currentTab) {
                case 'dashboard':
                    await DashboardAPI.load();
                    break;
                case 'buku':
                    await BookAPI.loadAll();
                    break;
                case 'pelanggan':
                    await CustomerAPI.loadAll();
                    break;
                case 'peminjaman':
                    await BorrowingAPI.loadAll();
                    break;
                case 'denda':
                    await FineAPI.loadAll();
                    break;
                case 'membership':
                    await MembershipAPI.loadAll();
                    break;
            }
        } catch (error) {
            console.error(`Failed to refresh ${this.currentTab} tab:`, error);
            AlertManager.error(`Gagal memuat data ${this.currentTab}.`);
        }
    }

    filterTable(tableBodyId, searchTerm) {
        const tableBody = document.getElementById(tableBodyId);
        if (!tableBody) return;
        
        const rows = tableBody.querySelectorAll('tr');
        const term = searchTerm.toLowerCase().trim();
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const shouldShow = !term || text.includes(term);
            row.style.display = shouldShow ? '' : 'none';
        });
        
        // Update row count
        const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none');
        this.updateTableInfo(tableBodyId, visibleRows.length, rows.length);
    }

    filterTableByStatus(tableBodyId, status) {
        const tableBody = document.getElementById(tableBodyId);
        if (!tableBody) return;
        
        const rows = tableBody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const statusCell = row.querySelector('.status-badge');
            if (!statusCell) return;
            
            const rowStatus = statusCell.dataset.status || statusCell.textContent.toLowerCase();
            const shouldShow = !status || status === 'all' || rowStatus.includes(status.toLowerCase());
            row.style.display = shouldShow ? '' : 'none';
        });
        
        // Update row count
        const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none');
        this.updateTableInfo(tableBodyId, visibleRows.length, rows.length);
    }

    updateTableInfo(tableBodyId, visibleCount, totalCount) {
        const tableContainer = document.getElementById(tableBodyId)?.closest('.table-container');
        if (!tableContainer) return;
        
        let infoElement = tableContainer.querySelector('.table-info');
        if (!infoElement) {
            infoElement = document.createElement('div');
            infoElement.className = 'table-info';
            tableContainer.appendChild(infoElement);
        }
        
        if (visibleCount === totalCount) {
            infoElement.textContent = `Menampilkan ${totalCount} data`;
        } else {
            infoElement.textContent = `Menampilkan ${visibleCount} dari ${totalCount} data`;
        }
    }

    async checkOverdueItems() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/overdue-check`);
            const data = await response.json();
            
            if (data.overdueCount > 0) {
                AlertManager.warning(`Ada ${data.overdueCount} peminjaman yang sudah jatuh tempo!`);
            }
        } catch (error) {
            console.error('Failed to check overdue items:', error);
        }
    }

    // Utility methods for external use
    getCurrentTab() {
        return this.currentTab;
    }

    isOnline() {
        return this.connectionStatus;
    }

    async exportData(type = 'all') {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/export/${type}`);
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `library_data_${type}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            AlertManager.success('Data berhasil diekspor!');
        } catch (error) {
            console.error('Export failed:', error);
            AlertManager.error('Gagal mengekspor data.');
        }
    }

    async importData(file, type) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/import`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                AlertManager.success(`Data berhasil diimpor! ${result.imported} record ditambahkan.`);
                await this.refreshCurrentTab();
            } else {
                AlertManager.error(result.message || 'Gagal mengimpor data.');
            }
        } catch (error) {
            console.error('Import failed:', error);
            AlertManager.error('Gagal mengimpor data.');
        }
    }

    // Handle browser back/forward navigation
    handlePopState() {
        const hash = window.location.hash.substring(1);
        if (hash && hash !== this.currentTab) {
            this.switchTab(hash);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.libraryApp = new LibraryApp();
    window.libraryApp.init();
    
    // Handle browser navigation
    window.addEventListener('popstate', () => {
        window.libraryApp.handlePopState();
    });
    
    // Set initial tab from URL hash
    const initialTab = window.location.hash.substring(1);
    if (initialTab) {
        window.libraryApp.switchTab(initialTab);
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.libraryApp) {
        // Refresh when page becomes visible again
        setTimeout(() => {
            window.libraryApp.refreshCurrentTab();
        }, 1000);
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    // Clean up any ongoing operations
    if (window.libraryApp) {
        console.log('🔄 Cleaning up before page unload...');
    }
});