<?php
// models/Denda.php
class Denda {
    private $conn;
    private $table_name = "denda";

    public $id_denda;
    public $id_pelanggan;
    public $jumlah_hari_telat;
    public $jumlah_denda;
    public $status_denda;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        $query = "SELECT d.*, p.nama as nama_pelanggan
                  FROM " . $this->table_name . " d
                  LEFT JOIN pelanggan p ON d.id_pelanggan = p.id_pelanggan
                  ORDER BY d.status_denda, d.jumlah_denda DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function create() {
        // Generate new ID
        $query = "SELECT LPAD(CAST(SUBSTRING_INDEX(MAX(id_denda), 'D', -1) AS UNSIGNED) + 1, 3, '0') as new_id FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $this->id_denda = 'D' . ($row['new_id'] ?? '001');

        $query = "INSERT INTO " . $this->table_name . " 
                SET id_denda=:id_denda, id_pelanggan=:id_pelanggan, 
                    jumlah_hari_telat=:jumlah_hari_telat, jumlah_denda=:jumlah_denda, 
                    status_denda=:status_denda";

        $stmt = $this->conn->prepare($query);

        $this->id_pelanggan = htmlspecialchars(strip_tags($this->id_pelanggan));
        $this->jumlah_hari_telat = htmlspecialchars(strip_tags($this->jumlah_hari_telat));
        $this->jumlah_denda = htmlspecialchars(strip_tags($this->jumlah_denda));
        $this->status_denda = 'Belum Lunas';

        $stmt->bindParam(":id_denda", $this->id_denda);
        $stmt->bindParam(":id_pelanggan", $this->id_pelanggan);
        $stmt->bindParam(":jumlah_hari_telat", $this->jumlah_hari_telat);
        $stmt->bindParam(":jumlah_denda", $this->jumlah_denda);
        $stmt->bindParam(":status_denda", $this->status_denda);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                SET id_pelanggan=:id_pelanggan, jumlah_hari_telat=:jumlah_hari_telat, 
                    jumlah_denda=:jumlah_denda, status_denda=:status_denda
                WHERE id_denda = :id_denda";

        $stmt = $this->conn->prepare($query);

        $this->id_pelanggan = htmlspecialchars(strip_tags($this->id_pelanggan));
        $this->jumlah_hari_telat = htmlspecialchars(strip_tags($this->jumlah_hari_telat));
        $this->jumlah_denda = htmlspecialchars(strip_tags($this->jumlah_denda));
        $this->status_denda = htmlspecialchars(strip_tags($this->status_denda));
        $this->id_denda = htmlspecialchars(strip_tags($this->id_denda));

        $stmt->bindParam(":id_pelanggan", $this->id_pelanggan);
        $stmt->bindParam(":jumlah_hari_telat", $this->jumlah_hari_telat);
        $stmt->bindParam(":jumlah_denda", $this->jumlah_denda);
        $stmt->bindParam(":status_denda", $this->status_denda);
        $stmt->bindParam(":id_denda", $this->id_denda);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id_denda = ?";
        $stmt = $this->conn->prepare($query);
        $this->id_denda = htmlspecialchars(strip_tags($this->id_denda));
        $stmt->bindParam(1, $this->id_denda);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function bayarDenda($id_denda, $metode_transaksi) {
        // Call stored procedure
        $query = "CALL bayar_denda(?, ?)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id_denda);
        $stmt->bindParam(2, $metode_transaksi);
        
        return $stmt->execute();
    }

    public function generateDendaOtomatis() {
        // Call stored procedure
        $query = "CALL buat_denda_otomatis()";
        $stmt = $this->conn->prepare($query);
        
        return $stmt->execute();
    }

    public function readOne() {
        $query = "SELECT d.*, p.nama as nama_pelanggan
                  FROM " . $this->table_name . " d
                  LEFT JOIN pelanggan p ON d.id_pelanggan = p.id_pelanggan
                  WHERE d.id_denda = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_denda);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if($row) {
            $this->id_pelanggan = $row['id_pelanggan'];
            $this->jumlah_hari_telat = $row['jumlah_hari_telat'];
            $this->jumlah_denda = $row['jumlah_denda'];
            $this->status_denda = $row['status_denda'];
            return true;
        }
        return false;
    }

    public function updateStatus($id_denda, $status) {
        $query = "UPDATE " . $this->table_name . " 
                SET status_denda = :status 
                WHERE id_denda = :id_denda";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":id_denda", $id_denda);
        
        return $stmt->execute();
    }

    public function getTotalUnpaidFines() {
        $query = "SELECT COUNT(*) as total, IFNULL(SUM(jumlah_denda), 0) as total_amount
                  FROM " . $this->table_name . " 
                  WHERE status_denda = 'Belum Lunas'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getFinesByCustomer($id_pelanggan) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE id_pelanggan = :id_pelanggan
                  ORDER BY status_denda, jumlah_denda DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_pelanggan", $id_pelanggan);
        $stmt->execute();
        
        return $stmt;
    }

    public function search($keywords) {
        $query = "SELECT d.*, p.nama as nama_pelanggan
                  FROM " . $this->table_name . " d
                  LEFT JOIN pelanggan p ON d.id_pelanggan = p.id_pelanggan
                  WHERE p.nama LIKE ? OR d.id_denda LIKE ?
                  ORDER BY d.status_denda, d.jumlah_denda DESC";
        
        $stmt = $this->conn->prepare($query);
        $keywords = htmlspecialchars(strip_tags($keywords));
        $keywords = "%{$keywords}%";
        
        $stmt->bindParam(1, $keywords);
        $stmt->bindParam(2, $keywords);
        $stmt->execute();
        
        return $stmt; // YANG INI KURANG!
    }

    public function getDendaByStatus($status) {
        $query = "SELECT d.*, p.nama as nama_pelanggan
                  FROM " . $this->table_name . " d
                  LEFT JOIN pelanggan p ON d.id_pelanggan = p.id_pelanggan
                  WHERE d.status_denda = :status
                  ORDER BY d.jumlah_denda DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $status);
        $stmt->execute();
        
        return $stmt;
    }

    public function calculateFine($days_late, $rate_per_day = 3000) {
        return $days_late * $rate_per_day;
    }

    public function getDendaStats() {
        $query = "SELECT 
                    COUNT(*) as total_denda,
                    COUNT(CASE WHEN status_denda = 'Lunas' THEN 1 END) as lunas,
                    COUNT(CASE WHEN status_denda = 'Belum Lunas' THEN 1 END) as belum_lunas,
                    IFNULL(SUM(jumlah_denda), 0) as total_amount,
                    IFNULL(SUM(CASE WHEN status_denda = 'Lunas' THEN jumlah_denda END), 0) as lunas_amount,
                    IFNULL(SUM(CASE WHEN status_denda = 'Belum Lunas' THEN jumlah_denda END), 0) as belum_lunas_amount
                  FROM " . $this->table_name;
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getTopFines($limit = 10) {
        $query = "SELECT d.*, p.nama as nama_pelanggan
                  FROM " . $this->table_name . " d
                  LEFT JOIN pelanggan p ON d.id_pelanggan = p.id_pelanggan
                  ORDER BY d.jumlah_denda DESC
                  LIMIT :limit";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getOverdueFines($days = 30) {
        $query = "SELECT d.*, p.nama as nama_pelanggan,
                         pm.tenggat_peminjaman,
                         DATEDIFF(CURDATE(), pm.tenggat_peminjaman) as total_days_overdue
                  FROM " . $this->table_name . " d
                  LEFT JOIN pelanggan p ON d.id_pelanggan = p.id_pelanggan
                  LEFT JOIN peminjaman pm ON p.id_pelanggan = pm.id_pelanggan
                  WHERE d.status_denda = 'Belum Lunas'
                  AND DATEDIFF(CURDATE(), pm.tenggat_peminjaman) > :days
                  ORDER BY total_days_overdue DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":days", $days);
        $stmt->execute();
        
        return $stmt;
    }

    public function massUpdateFines($id_pelanggan_array, $status) {
        if (empty($id_pelanggan_array)) {
            return false;
        }
        
        $placeholders = str_repeat('?,', count($id_pelanggan_array) - 1) . '?';
        
        $query = "UPDATE " . $this->table_name . " 
                SET status_denda = ? 
                WHERE id_pelanggan IN ($placeholders)";
        
        $stmt = $this->conn->prepare($query);
        
        // Bind status first, then all id_pelanggan values
        $params = array_merge([$status], $id_pelanggan_array);
        
        return $stmt->execute($params);
    }
}
?>