<?php
class Peminjaman {
    private $conn;
    private $table_name = "peminjaman";

    public $id_peminjaman;
    public $id_pelanggan;
    public $tanggal_peminjaman;
    public $tenggat_peminjaman;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        $query = "SELECT p.*, pl.nama as nama_pelanggan,
                         GROUP_CONCAT(b.judul_buku SEPARATOR ', ') as judul_buku,
                         GROUP_CONCAT(dp.status_peminjaman SEPARATOR ', ') as status_peminjaman
                  FROM " . $this->table_name . " p
                  LEFT JOIN pelanggan pl ON p.id_pelanggan = pl.id_pelanggan
                  LEFT JOIN detail_peminjaman dp ON p.id_peminjaman = dp.id_peminjaman
                  LEFT JOIN buku b ON dp.isbn_buku = b.isbn_buku
                  GROUP BY p.id_peminjaman
                  ORDER BY p.tanggal_peminjaman DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function create() {
        // Generate new ID
        $query = "SELECT LPAD(CAST(SUBSTRING_INDEX(MAX(id_peminjaman), 'PM', -1) AS UNSIGNED) + 1, 3, '0') as new_id FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $this->id_peminjaman = 'PM' . ($row['new_id'] ?? '001');

        $query = "INSERT INTO " . $this->table_name . " 
                SET id_peminjaman=:id_peminjaman, id_pelanggan=:id_pelanggan, 
                    tanggal_peminjaman=:tanggal_peminjaman, tenggat_peminjaman=:tenggat_peminjaman";

        $stmt = $this->conn->prepare($query);

        $this->id_pelanggan = htmlspecialchars(strip_tags($this->id_pelanggan));
        $this->tanggal_peminjaman = htmlspecialchars(strip_tags($this->tanggal_peminjaman));
        $this->tenggat_peminjaman = htmlspecialchars(strip_tags($this->tenggat_peminjaman));

        $stmt->bindParam(":id_peminjaman", $this->id_peminjaman);
        $stmt->bindParam(":id_pelanggan", $this->id_pelanggan);
        $stmt->bindParam(":tanggal_peminjaman", $this->tanggal_peminjaman);
        $stmt->bindParam(":tenggat_peminjaman", $this->tenggat_peminjaman);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function addDetailPeminjaman($isbn_buku) {
        // Generate new detail ID
        $query = "SELECT LPAD(CAST(SUBSTRING_INDEX(MAX(id_detail_peminjaman), 'DP', -1) AS UNSIGNED) + 1, 3, '0') as new_id FROM detail_peminjaman";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $detail_id = 'DP' . ($row['new_id'] ?? '001');

        $query = "INSERT INTO detail_peminjaman 
                SET id_detail_peminjaman=:id_detail_peminjaman, isbn_buku=:isbn_buku, 
                    id_peminjaman=:id_peminjaman, status_peminjaman='Dipinjam'";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_detail_peminjaman", $detail_id);
        $stmt->bindParam(":isbn_buku", $isbn_buku);
        $stmt->bindParam(":id_peminjaman", $this->id_peminjaman);

        return $stmt->execute();
    }

    public function kembalikanBuku($id_detail_peminjaman) {
        $query = "UPDATE detail_peminjaman 
                SET status_peminjaman = 'Dikembalikan'
                WHERE id_detail_peminjaman = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id_detail_peminjaman);
        
        return $stmt->execute();
    }

    public function kembalikanByPeminjaman($id_peminjaman) {
        $query = "UPDATE detail_peminjaman 
                SET status_peminjaman = 'Dikembalikan'
                WHERE id_peminjaman = ? AND status_peminjaman = 'Dipinjam'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id_peminjaman);
        
        return $stmt->execute();
    }

    public function readOne() {
        $query = "SELECT p.*, pl.nama as nama_pelanggan
                  FROM " . $this->table_name . " p
                  LEFT JOIN pelanggan pl ON p.id_pelanggan = pl.id_pelanggan
                  WHERE p.id_peminjaman = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_peminjaman);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if($row) {
            $this->id_pelanggan = $row['id_pelanggan'];
            $this->tanggal_peminjaman = $row['tanggal_peminjaman'];
            $this->tenggat_peminjaman = $row['tenggat_peminjaman'];
            return true;
        }
        return false;
    }

    public function getDetailPeminjaman($id_peminjaman) {
        $query = "SELECT dp.*, b.judul_buku, b.penulis
                  FROM detail_peminjaman dp
                  LEFT JOIN buku b ON dp.isbn_buku = b.isbn_buku
                  WHERE dp.id_peminjaman = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id_peminjaman);
        $stmt->execute();
        
        return $stmt;
    }

    public function getOverdueBooks() {
        $query = "SELECT p.*, pl.nama as nama_pelanggan, 
                         DATEDIFF(CURDATE(), p.tenggat_peminjaman) as hari_telat
                  FROM " . $this->table_name . " p
                  LEFT JOIN pelanggan pl ON p.id_pelanggan = pl.id_pelanggan
                  LEFT JOIN detail_peminjaman dp ON p.id_peminjaman = dp.id_peminjaman
                  WHERE p.tenggat_peminjaman < CURDATE() 
                  AND dp.status_peminjaman = 'Dipinjam'
                  GROUP BY p.id_peminjaman
                  ORDER BY p.tenggat_peminjaman ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function getBorrowingHistory($id_pelanggan) {
        $query = "SELECT p.*, 
                         GROUP_CONCAT(b.judul_buku SEPARATOR ', ') as judul_buku,
                         GROUP_CONCAT(dp.status_peminjaman SEPARATOR ', ') as status_peminjaman
                  FROM " . $this->table_name . " p
                  LEFT JOIN detail_peminjaman dp ON p.id_peminjaman = dp.id_peminjaman
                  LEFT JOIN buku b ON dp.isbn_buku = b.isbn_buku
                  WHERE p.id_pelanggan = ?
                  GROUP BY p.id_peminjaman
                  ORDER BY p.tanggal_peminjaman DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id_pelanggan);
        $stmt->execute();
        return $stmt;
    }
}