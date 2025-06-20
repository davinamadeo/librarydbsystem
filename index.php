<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistem Manajemen Perpustakaan</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <div class="container">
        <!-- Header -->
        <header class="header">
            <div class="header-content">
                <div class="logo">
                    <i class="fas fa-book-open"></i>
                    <h1>Sistem Manajemen Perpustakaan</h1>
                </div>
                <p class="subtitle">Kelola koleksi buku, anggota, dan transaksi perpustakaan dengan mudah</p>
            </div>
        </header>

        <!-- Navigation -->
        <nav class="nav-tabs">
            <button class="nav-tab active" data-tab="dashboard">
                <i class="fas fa-chart-pie"></i>
                <span>Dashboard</span>
            </button>
            <button class="nav-tab" data-tab="buku">
                <i class="fas fa-book"></i>
                <span>Buku</span>
            </button>
            <button class="nav-tab" data-tab="pelanggan">
                <i class="fas fa-users"></i>
                <span>Pelanggan</span>
            </button>
            <button class="nav-tab" data-tab="peminjaman">
                <i class="fas fa-handshake"></i>
                <span>Peminjaman</span>
            </button>
            <button class="nav-tab" data-tab="denda">
                <i class="fas fa-money-bill-wave"></i>
                <span>Denda</span>
            </button>
            <button class="nav-tab" data-tab="membership">
                <i class="fas fa-crown"></i>
                <span>Membership</span>
            </button>
        </nav>

        <!-- Dashboard Tab -->
        <main id="dashboardTab" class="tab-content active">
            <div class="page-header">
                <h2><i class="fas fa-chart-pie"></i> Dashboard</h2>
                <button class="btn btn-refresh" onclick="window.libraryApp ? window.libraryApp.refreshCurrentTab() : loadDashboard()">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>

            <!-- Statistics Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number" id="totalBuku">-</div>
                        <div class="stat-label">Total Buku</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number" id="totalPelanggan">-</div>
                        <div class="stat-label">Total Pelanggan</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-handshake"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number" id="bukuDipinjam">-</div>
                        <div class="stat-label">Buku Dipinjam</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number" id="dendaBelumLunas">-</div>
                        <div class="stat-label">Denda Belum Lunas</div>
                    </div>
                </div>
            </div>

            <!-- Recent Activities -->
            <div class="content-card">
                <div class="card-header">
                    <h3><i class="fas fa-history"></i> Aktivitas Terbaru</h3>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Aktivitas</th>
                                <th>Detail</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="activitiesTableBody">
                            <tr>
                                <td colspan="4" class="loading">
                                    <i class="fas fa-spinner fa-spin"></i> Memuat data...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>

        <!-- Buku Tab -->
        <main id="bukuTab" class="tab-content">
            <div class="page-header">
                <h2><i class="fas fa-book"></i> Manajemen Buku</h2>
            </div>

            <!-- Add Book Form -->
            <div class="content-card">
                <div class="card-header">
                    <h3><i class="fas fa-plus"></i> Tambah/Edit Buku</h3>
                </div>
                <form id="bukuForm" class="form-grid">
                    <div class="form-group">
                        <label for="isbn"><i class="fas fa-barcode"></i> ISBN Buku</label>
                        <input type="text" id="isbn" name="isbn" required maxlength="13" placeholder="978-xxx-xxx-xxx-x">
                    </div>
                    
                    <div class="form-group">
                        <label for="judulBuku"><i class="fas fa-heading"></i> Judul Buku</label>
                        <input type="text" id="judulBuku" name="judulBuku" required maxlength="100" placeholder="Masukkan judul buku">
                    </div>
                    
                    <div class="form-group">
                        <label for="penulis"><i class="fas fa-user-edit"></i> Penulis</label>
                        <input type="text" id="penulis" name="penulis" maxlength="100" placeholder="Nama penulis">
                    </div>
                    
                    <div class="form-group">
                        <label for="penerbit"><i class="fas fa-building"></i> Penerbit</label>
                        <input type="text" id="penerbit" name="penerbit" maxlength="100" placeholder="Nama penerbit">
                    </div>
                    
                    <div class="form-group">
                        <label for="tahunTerbit"><i class="fas fa-calendar"></i> Tahun Terbit</label>
                        <input type="date" id="tahunTerbit" name="tahunTerbit">
                    </div>
                    
                    <div class="form-group">
                        <label for="kategori"><i class="fas fa-tags"></i> Kategori</label>
                        <select id="kategori" name="kategori" required>
                            <option value="">Pilih Kategori</option>
                            <option value="Fiksi">Fiksi</option>
                            <option value="Non-Fiksi">Non-Fiksi</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="stock"><i class="fas fa-boxes"></i> Stok</label>
                        <input type="number" id="stock" name="stock" min="0" required placeholder="0">
                    </div>
                    
                    <div class="form-group">
                        <label for="statusBuku"><i class="fas fa-toggle-on"></i> Status Buku</label>
                        <select id="statusBuku" name="statusBuku" required>
                            <option value="Tersedia">Tersedia</option>
                            <option value="Tidak Tersedia">Tidak Tersedia</option>
                        </select>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary" id="bukuSubmitBtn">
                            <i class="fas fa-save"></i> Simpan Buku
                        </button>
                        <button type="reset" class="btn btn-secondary">
                            <i class="fas fa-undo"></i> Reset
                        </button>
                    </div>
                </form>
            </div>

            <!-- Search and Table -->
            <div class="content-card">
                <div class="card-header">
                    <h3><i class="fas fa-list"></i> Daftar Buku</h3>
                    <div class="header-actions">
                        <div class="search-container">
                            <i class="fas fa-search"></i>
                            <input type="text" id="bukuSearch" placeholder="Cari buku..." class="search-input">
                        </div>
                        <button class="btn btn-refresh" onclick="window.libraryApp ? window.libraryApp.refreshCurrentTab() : loadBuku()">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ISBN</th>
                                <th>Judul</th>
                                <th>Penulis</th>
                                <th>Kategori</th>
                                <th>Stok</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="bukuTableBody">
                            <tr>
                                <td colspan="7" class="loading">
                                    <i class="fas fa-spinner fa-spin"></i> Memuat data...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>

        <!-- Pelanggan Tab -->
        <main id="pelangganTab" class="tab-content">
            <div class="page-header">
                <h2><i class="fas fa-users"></i> Manajemen Pelanggan</h2>
            </div>

            <!-- Add Customer Form -->
            <div class="content-card">
                <div class="card-header">
                    <h3><i class="fas fa-user-plus"></i> Tambah Pelanggan Baru</h3>
                </div>
                <form id="pelangganForm" class="form-grid">
                    <div class="form-group">
                        <label for="namaPelanggan"><i class="fas fa-user"></i> Nama Lengkap</label>
                        <input type="text" id="namaPelanggan" name="namaPelanggan" required maxlength="100" placeholder="Nama lengkap pelanggan">
                    </div>
                    
                    <div class="form-group">
                        <label for="alamat"><i class="fas fa-map-marker-alt"></i> Alamat</label>
                        <input type="text" id="alamat" name="alamat" maxlength="100" placeholder="Alamat lengkap">
                    </div>
                    
                    <div class="form-group">
                        <label for="noTelp"><i class="fas fa-phone"></i> No. Telepon</label>
                        <input type="tel" id="noTelp" name="noTelp" maxlength="20" placeholder="08xxxxxxxxxx">
                    </div>
                    
                    <div class="form-group">
                        <label for="email"><i class="fas fa-envelope"></i> Email</label>
                        <input type="email" id="email" name="email" maxlength="100" placeholder="email@example.com">
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary" id="pelangganSubmitBtn">
                            <i class="fas fa-user-plus"></i> Simpan Pelanggan
                        </button>
                        <button type="reset" class="btn btn-secondary">
                            <i class="fas fa-undo"></i> Reset
                        </button>
                    </div>
                </form>
            </div>

            <!-- Customer List -->
            <div class="content-card">
                <div class="card-header">
                    <h3><i class="fas fa-list"></i> Daftar Pelanggan</h3>
                    <div class="header-actions">
                        <div class="search-container">
                            <i class="fas fa-search"></i>
                            <input type="text" id="pelangganSearch" placeholder="Cari pelanggan..." class="search-input">
                        </div>
                        <button class="btn btn-refresh" onclick="window.libraryApp ? window.libraryApp.refreshCurrentTab() : loadPelanggan()">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nama</th>
                                <th>Alamat</th>
                                <th>No. Telepon</th>
                                <th>Email</th>
                                <th>Status Membership</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="pelangganTableBody">
                            <tr>
                                <td colspan="7" class="loading">
                                    <i class="fas fa-spinner fa-spin"></i> Memuat data...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>

        <!-- Peminjaman Tab -->
        <main id="peminjamanTab" class="tab-content">
            <div class="page-header">
                <h2><i class="fas fa-handshake"></i> Manajemen Peminjaman</h2>
            </div>

            <!-- Add Borrowing Form -->
            <div class="content-card">
                <div class="card-header">
                    <h3><i class="fas fa-plus"></i> Proses Peminjaman Baru</h3>
                </div>
                <form id="peminjamanForm" class="form-grid">
                    <div class="form-group">
                        <label for="pelangganPeminjam"><i class="fas fa-user"></i> Pelanggan</label>
                        <select id="pelangganPeminjam" name="pelangganPeminjam" required>
                            <option value="">Pilih Pelanggan</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="bukuPeminjam"><i class="fas fa-book"></i> Buku</label>
                        <select id="bukuPeminjam" name="bukuPeminjam" required>
                            <option value="">Pilih Buku</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="tanggalPeminjaman"><i class="fas fa-calendar-plus"></i> Tanggal Peminjaman</label>
                        <input type="date" id="tanggalPeminjaman" name="tanggalPeminjaman" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="tenggatPeminjaman"><i class="fas fa-calendar-times"></i> Tenggat Peminjaman</label>
                        <input type="date" id="tenggatPeminjaman" name="tenggatPeminjaman" required readonly>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary" id="peminjamanSubmitBtn">
                            <i class="fas fa-handshake"></i> Proses Peminjaman
                        </button>
                        <button type="reset" class="btn btn-secondary">
                            <i class="fas fa-undo"></i> Reset
                        </button>
                    </div>
                </form>
            </div>

            <!-- Borrowing List -->
            <div class="content-card">
                <div class="card-header">
                    <h3><i class="fas fa-list"></i> Daftar Peminjaman</h3>
                    <div class="header-actions">
                        <div class="search-container">
                            <i class="fas fa-search"></i>
                            <input type="text" id="peminjamanSearch" placeholder="Cari peminjaman..." class="search-input">
                        </div>
                        <select id="peminjamanStatusFilter" class="filter-select">
                            <option value="">Semua Status</option>
                            <option value="Dipinjam">Dipinjam</option>
                            <option value="Dikembalikan">Dikembalikan</option>
                        </select>
                        <button class="btn btn-refresh" onclick="window.libraryApp ? window.libraryApp.refreshCurrentTab() : loadPeminjaman()">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID Peminjaman</th>
                                <th>Pelanggan</th>
                                <th>Judul Buku</th>
                                <th>Tanggal Pinjam</th>
                                <th>Tenggat</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="peminjamanTableBody">
                            <tr>
                                <td colspan="7" class="loading">
                                    <i class="fas fa-spinner fa-spin"></i> Memuat data...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>

        <!-- Denda Tab -->
        <main id="dendaTab" class="tab-content">
            <div class="page-header">
                <h2><i class="fas fa-money-bill-wave"></i> Manajemen Denda</h2>
                <button class="btn btn-success" onclick="generateDendaOtomatis()">
                    <i class="fas fa-magic"></i> Generate Denda Otomatis
                </button>
            </div>

            <div class="content-card">
                <div class="card-header">
                    <h3><i class="fas fa-list"></i> Daftar Denda</h3>
                    <div class="header-actions">
                        <div class="search-container">
                            <i class="fas fa-search"></i>
                            <input type="text" id="dendaSearch" placeholder="Cari denda..." class="search-input">
                        </div>
                        <select id="dendaStatusFilter" class="filter-select">
                            <option value="">Semua Status</option>
                            <option value="Lunas">Lunas</option>
                            <option value="Belum Lunas">Belum Lunas</option>
                        </select>
                        <button class="btn btn-refresh" onclick="window.libraryApp ? window.libraryApp.refreshCurrentTab() : loadDenda()">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID Denda</th>
                                <th>Pelanggan</th>
                                <th>Hari Telat</th>
                                <th>Jumlah Denda</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="dendaTableBody">
                            <tr>
                                <td colspan="6" class="loading">
                                    <i class="fas fa-spinner fa-spin"></i> Memuat data...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>

        <!-- Membership Tab -->
        <main id="membershipTab" class="tab-content">
            <div class="page-header">
                <h2><i class="fas fa-crown"></i> Manajemen Membership</h2>
            </div>

            <!-- Add Membership Form -->
            <div class="content-card">
                <div class="card-header">
                    <h3><i class="fas fa-plus"></i> Tambah/Perpanjang Membership</h3>
                </div>
                <form id="membershipForm" class="form-grid">
                    <div class="form-group">
                        <label for="pelangganMember"><i class="fas fa-user"></i> Pelanggan</label>
                        <select id="pelangganMember" name="pelangganMember" required>
                            <option value="">Pilih Pelanggan</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="paketMembership"><i class="fas fa-box"></i> Paket Membership</label>
                        <select id="paketMembership" name="paketMembership" required>
                            <option value="">Pilih Paket</option>
                            <option value="1 Bulan" data-price="50000">1 Bulan - Rp 50,000</option>
                            <option value="3 Bulan" data-price="130000">3 Bulan - Rp 130,000</option>
                            <option value="6 Bulan" data-price="250000">6 Bulan - Rp 250,000</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="tanggalMulai"><i class="fas fa-calendar-plus"></i> Tanggal Mulai</label>
                        <input type="date" id="tanggalMulai" name="tanggalMulai" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="metodePembayaran"><i class="fas fa-credit-card"></i> Metode Pembayaran</label>
                        <select id="metodePembayaran" name="metodePembayaran" required>
                            <option value="">Pilih Metode</option>
                            <option value="Cash">Cash</option>
                            <option value="Qris">QRIS</option>
                            <option value="Debit">Debit</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="nominalMembership"><i class="fas fa-money-bill"></i> Nominal Pembayaran</label>
                        <input type="number" id="nominalMembership" name="nominalMembership" readonly>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary" id="membershipSubmitBtn">
                            <i class="fas fa-crown"></i> Proses Membership
                        </button>
                        <button type="reset" class="btn btn-secondary">
                            <i class="fas fa-undo"></i> Reset
                        </button>
                    </div>
                </form>
            </div>

            <!-- Membership List -->
            <div class="content-card">
                <div class="card-header">
                    <h3><i class="fas fa-list"></i> Daftar Membership</h3>
                    <div class="header-actions">
                        <div class="search-container">
                            <i class="fas fa-search"></i>
                            <input type="text" id="membershipSearch" placeholder="Cari membership..." class="search-input">
                        </div>
                        <select id="membershipStatusFilter" class="filter-select">
                            <option value="">Semua Status</option>
                            <option value="Aktif">Aktif</option>
                            <option value="Expired">Expired</option>
                        </select>
                        <button class="btn btn-refresh" onclick="window.libraryApp ? window.libraryApp.refreshCurrentTab() : loadMembership()">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID Member</th>
                                <th>Pelanggan</th>
                                <th>Paket</th>
                                <th>Tanggal Mulai</th>
                                <th>Tanggal Expired</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="membershipTableBody">
                            <tr>
                                <td colspan="7" class="loading">
                                    <i class="fas fa-spinner fa-spin"></i> Memuat data...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <!-- Loading Overlay -->
    <div id="loadingOverlay" class="loading-overlay">
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Memproses...</p>
        </div>
    </div>

    <!-- Scripts -->
    <script src="js/config.js"></script>
    <script src="js/utils.js"></script>
    <script src="js/api.js"></script>
    <script src="js/app.js"></script>

</body>
</html>