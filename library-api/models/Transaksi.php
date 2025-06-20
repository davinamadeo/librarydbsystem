<?php
class Transaksi {
    private $conn;
    private $table_name = "transaksi";

    public $id_transaksi;
    public $id_pelanggan;
    public $jenis_transaksi;
    public $tanggal_transaksi;
    public $nominal;
    public $metode_transaksi;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        $query = "SELECT t.*, p.nama as nama_pelanggan
                  FROM " . $this->table_name . " t
                  LEFT JOIN pelanggan p ON t.id_pelanggan = p.id_pelanggan
                  ORDER BY t.tanggal_transaksi DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function create() {
        // Generate new ID
        $query = "SELECT LPAD(CAST(SUBSTRING_INDEX(MAX(id_transaksi), 'T', -1) AS UNSIGNED) + 1, 4, '0') as new_id FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $this->id_transaksi = 'T' . ($row['new_id'] ?? '0001');

        $query = "INSERT INTO " . $this->table_name . " 
                SET id_transaksi=:id_transaksi, id_pelanggan=:id_pelanggan, 
                    jenis_transaksi=:jenis_transaksi, tanggal_transaksi=:tanggal_transaksi,
                    nominal=:nominal, metode_transaksi=:metode_transaksi";

        $stmt = $this->conn->prepare($query);

        $this->id_pelanggan = htmlspecialchars(strip_tags($this->id_pelanggan));
        $this->jenis_transaksi = htmlspecialchars(strip_tags($this->jenis_transaksi));
        $this->tanggal_transaksi = htmlspecialchars(strip_tags($this->tanggal_transaksi));
        $this->nominal = htmlspecialchars(strip_tags($this->nominal));
        $this->metode_transaksi = htmlspecialchars(strip_tags($this->metode_transaksi));

        $stmt->bindParam(":id_transaksi", $this->id_transaksi);
        $stmt->bindParam(":id_pelanggan", $this->id_pelanggan);
        $stmt->bindParam(":jenis_transaksi", $this->jenis_transaksi);
        $stmt->bindParam(":tanggal_transaksi", $this->tanggal_transaksi);
        $stmt->bindParam(":nominal", $this->nominal);
        $stmt->bindParam(":metode_transaksi", $this->metode_transaksi);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function readOne() {
        $query = "SELECT t.*, p.nama as nama_pelanggan
                  FROM " . $this->table_name . " t
                  LEFT JOIN pelanggan p ON t.id_pelanggan = p.id_pelanggan
                  WHERE t.id_transaksi = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_transaksi);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if($row) {
            $this->id_pelanggan = $row['id_pelanggan'];
            $this->jenis_transaksi = $row['jenis_transaksi'];
            $this->tanggal_transaksi = $row['tanggal_transaksi'];
            $this->nominal = $row['nominal'];
            $this->metode_transaksi = $row['metode_transaksi'];
            return true;
        }
        return false;
    }

    public function getTransactionsByCustomer($id_pelanggan) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE id_pelanggan = :id_pelanggan
                  ORDER BY tanggal_transaksi DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_pelanggan", $id_pelanggan);
        $stmt->execute();
        
        return $stmt;
    }

    public function getTransactionsByDate($start_date, $end_date) {
        $query = "SELECT t.*, p.nama as nama_pelanggan
                  FROM " . $this->table_name . " t
                  LEFT JOIN pelanggan p ON t.id_pelanggan = p.id_pelanggan
                  WHERE t.tanggal_transaksi BETWEEN :start_date AND :end_date
                  ORDER BY t.tanggal_transaksi DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":start_date", $start_date);
        $stmt->bindParam(":end_date", $end_date);
        $stmt->execute();
        
        return $stmt;
    }

    public function getTransactionStats($start_date = null, $end_date = null) {
        $whereClause = "";
        if ($start_date && $end_date) {
            $whereClause = "WHERE tanggal_transaksi BETWEEN :start_date AND :end_date";
        }

        $query = "SELECT 
                    COUNT(*) as total_transactions,
                    IFNULL(SUM(nominal), 0) as total_amount,
                    COUNT(CASE WHEN jenis_transaksi = 'Bayar Denda' THEN 1 END) as fine_payments,
                    IFNULL(SUM(CASE WHEN jenis_transaksi = 'Bayar Denda' THEN nominal END), 0) as fine_amount,
                    COUNT(CASE WHEN metode_transaksi = 'Cash' THEN 1 END) as cash_transactions,
                    COUNT(CASE WHEN metode_transaksi = 'Qris' THEN 1 END) as qris_transactions,
                    COUNT(CASE WHEN metode_transaksi = 'Debit' THEN 1 END) as debit_transactions
                  FROM " . $this->table_name . " " . $whereClause;
        
        $stmt = $this->conn->prepare($query);
        
        if ($start_date && $end_date) {
            $stmt->bindParam(":start_date", $start_date);
            $stmt->bindParam(":end_date", $end_date);
        }
        
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function search($keywords) {
        $query = "SELECT t.*, p.nama as nama_pelanggan
                  FROM " . $this->table_name . " t
                  LEFT JOIN pelanggan p ON t.id_pelanggan = p.id_pelanggan
                  WHERE p.nama LIKE ? OR t.id_transaksi LIKE ? OR t.jenis_transaksi LIKE ?
                  ORDER BY t.tanggal_transaksi DESC";
        
        $stmt = $this->conn->prepare($query);
        $keywords = htmlspecialchars(strip_tags($keywords));
        $keywords = "%{$keywords}%";
        
        $stmt->bindParam(1, $keywords);
        $stmt->bindParam(2, $keywords);
        $stmt->bindParam(3, $keywords);
        $stmt->execute();
        
        return $stmt;
    }
}