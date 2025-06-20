<?php
class Dashboard {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getStats() {
        $stats = array();
        
        // Total buku
        $query = "SELECT COUNT(*) as total FROM buku";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['total_buku'] = $result['total'];
        
        // Total pelanggan
        $query = "SELECT COUNT(*) as total FROM pelanggan";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['total_pelanggan'] = $result['total'];
        
        // Buku dipinjam
        $query = "SELECT COUNT(*) as total FROM detail_peminjaman WHERE status_peminjaman = 'Dipinjam'";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['buku_dipinjam'] = $result['total'];
        
        // Denda belum lunas
        $query = "SELECT COUNT(*) as total FROM denda WHERE status_denda = 'Belum Lunas'";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['denda_belum_lunas'] = $result['total'];
        
        // Membership aktif
        $query = "SELECT COUNT(*) as total FROM membership WHERE tanggal_expired >= CURDATE()";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['membership_aktif'] = $result['total'];
        
        return $stats;
    }

    public function getRecentActivities($limit = 5) {
        $query = "SELECT 'Transaksi Membership' as type, tm.tanggal_transaksi as tanggal, 
                         CONCAT(p.nama, ' - ', tm.paket_langganan) as detail, 'Berhasil' as status
                  FROM transaksi_membership tm
                  LEFT JOIN pelanggan p ON tm.id_pelanggan = p.id_pelanggan
                  UNION ALL
                  SELECT 'Pembayaran Denda' as type, t.tanggal_transaksi as tanggal,
                         CONCAT(p.nama, ' - Rp ', FORMAT(t.nominal, 0)) as detail, 'Lunas' as status
                  FROM transaksi t
                  LEFT JOIN pelanggan p ON t.id_pelanggan = p.id_pelanggan
                  WHERE t.jenis_transaksi = 'Bayar Denda'
                  UNION ALL
                  SELECT 'Peminjaman Buku' as type, pm.tanggal_peminjaman as tanggal,
                         CONCAT(p.nama, ' - ', GROUP_CONCAT(b.judul_buku SEPARATOR ', ')) as detail, 'Dipinjam' as status
                  FROM peminjaman pm
                  LEFT JOIN pelanggan p ON pm.id_pelanggan = p.id_pelanggan
                  LEFT JOIN detail_peminjaman dp ON pm.id_peminjaman = dp.id_peminjaman
                  LEFT JOIN buku b ON dp.isbn_buku = b.isbn_buku
                  WHERE dp.status_peminjaman = 'Dipinjam'
                  GROUP BY pm.id_peminjaman, p.nama, pm.tanggal_peminjaman
                  ORDER BY tanggal DESC
                  LIMIT :limit";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getMonthlyReport($year = null, $month = null) {
        if (!$year) $year = date('Y');
        if (!$month) $month = date('m');
        
        $report = array();
        
        // Transaksi bulan ini
        $query = "SELECT COUNT(*) as total_transaksi, IFNULL(SUM(nominal), 0) as total_pendapatan
                  FROM transaksi 
                  WHERE YEAR(tanggal_transaksi) = :year AND MONTH(tanggal_transaksi) = :month";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":year", $year);
        $stmt->bindParam(":month", $month);
        $stmt->execute();
        $report['transaksi'] = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Peminjaman bulan ini
        $query = "SELECT COUNT(*) as total_peminjaman
                  FROM peminjaman 
                  WHERE YEAR(tanggal_peminjaman) = :year AND MONTH(tanggal_peminjaman) = :month";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":year", $year);
        $stmt->bindParam(":month", $month);
        $stmt->execute();
        $report['peminjaman'] = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Membership baru bulan ini
        $query = "SELECT COUNT(*) as membership_baru
                  FROM membership 
                  WHERE YEAR(tanggal_pembuatan) = :year AND MONTH(tanggal_pembuatan) = :month";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":year", $year);
        $stmt->bindParam(":month", $month);
        $stmt->execute();
        $report['membership'] = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $report;
    }

    public function getPopularBooks($limit = 10) {
        $query = "SELECT b.*, COUNT(dp.isbn_buku) as total_dipinjam
                  FROM buku b
                  LEFT JOIN detail_peminjaman dp ON b.isbn_buku = dp.isbn_buku
                  GROUP BY b.isbn_buku
                  ORDER BY total_dipinjam DESC
                  LIMIT :limit";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getOverdueBooks() {
        $query = "SELECT p.*, pl.nama as nama_pelanggan, b.judul_buku,
                         DATEDIFF(CURDATE(), p.tenggat_peminjaman) as hari_telat
                  FROM peminjaman p
                  LEFT JOIN pelanggan pl ON p.id_pelanggan = pl.id_pelanggan
                  LEFT JOIN detail_peminjaman dp ON p.id_peminjaman = dp.id_peminjaman
                  LEFT JOIN buku b ON dp.isbn_buku = b.isbn_buku
                  WHERE p.tenggat_peminjaman < CURDATE() 
                  AND dp.status_peminjaman = 'Dipinjam'
                  ORDER BY p.tenggat_peminjaman ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

    public function getAvailableBooks() {
        $query = "SELECT * FROM " . $this->table_name . " 
                WHERE status_buku = 'Tersedia' AND stock > 0
                ORDER BY judul_buku";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function updateStock($isbn, $amount) {
        $query = "UPDATE " . $this->table_name . " 
                SET stock = stock + :amount 
                WHERE isbn_buku = :isbn";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":amount", $amount);
        $stmt->bindParam(":isbn", $isbn);
        
        return $stmt->execute();
    }

    public function updateStatus($isbn, $status) {
        $query = "UPDATE " . $this->table_name . " 
                SET status_buku = :status 
                WHERE isbn_buku = :isbn";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":isbn", $isbn);
        
        return $stmt->execute();
    }


