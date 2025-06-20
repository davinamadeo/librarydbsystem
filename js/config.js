// js/config.js
const CONFIG = {
    APP_NAME: 'Sistem Manajemen Perpustakaan',
    
    // Sesuaikan dengan path server Anda
    API_BASE_URL: '/library-api', // Path relatif ke folder library-api
    
    // Atau jika menggunakan server lokal:
    // API_BASE_URL: 'http://localhost/library-api',
    
    ENDPOINTS: {
        // Dashboard
        DASHBOARD: '/api/dashboard.php',
        
        // Buku endpoints - sesuai struktur file Anda
        BUKU: {
            CREATE: '/api/buku/create.php',
            READ: '/api/buku/read.php',
            UPDATE: '/api/buku/update.php',
            DELETE: '/api/buku/delete.php'
        },
        
        // Pelanggan endpoints
        PELANGGAN: {
            CREATE: '/api/pelanggan/create.php',
            READ: '/api/pelanggan/read.php',
            UPDATE: '/api/pelanggan/update.php', // Jika ada
            DELETE: '/api/pelanggan/delete.php'  // Jika ada
        },
        
        // Peminjaman endpoints
        PEMINJAMAN: {
            CREATE: '/api/peminjaman/create.php',
            READ: '/api/peminjaman/read.php',
            RETURN: '/api/peminjaman/return.php'
        },
        
        // Denda endpoints
        DENDA: {
            READ: '/api/denda/read.php',
            GENERATE: '/api/denda/generate.php',
            BAYAR: '/api/denda/bayar.php'
        },
        
        // Membership endpoints
        MEMBERSHIP: {
            CREATE: '/api/membership/create.php',
            READ: '/api/membership/read.php'
        }
    },
    
    // Konfigurasi aplikasi
    BORROWING_DURATION_DAYS: 7,
    FINE_PER_DAY: 3000,
    
    // Messages
    MESSAGES: {
        SUCCESS: {
            SAVE: 'Data berhasil disimpan!',
            DELETE: 'Data berhasil dihapus!',
            UPDATE: 'Data berhasil diperbarui!',
            RETURN: 'Buku berhasil dikembalikan!',
            PAYMENT: 'Pembayaran berhasil!'
        },
        ERROR: {
            SAVE: 'Gagal menyimpan data.',
            DELETE: 'Gagal menghapus data.',
            LOAD: 'Gagal memuat data.',
            NETWORK: 'Terjadi kesalahan jaringan.',
            CONNECTION_FAILED: 'Koneksi terputus. Periksa internet Anda.',
            VALIDATION: 'Mohon lengkapi semua field yang diperlukan.'
        },
        INFO: {
            CONNECTION_RESTORED: 'Koneksi pulih kembali!',
            CONNECTION_LOST: 'Koneksi terputus!',
            LOADING: 'Memuat data...',
            NO_DATA: 'Tidak ada data untuk ditampilkan.'
        }
    }
};