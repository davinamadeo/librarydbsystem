<?php
class Pelanggan {
    private $conn;
    private $table_name = "pelanggan";

    public $id_pelanggan;
    public $nama;
    public $alamat;
    public $no_telp;
    public $email;
    public $status_membership;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY nama";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function create() {
        // Generate new ID
        $query = "SELECT LPAD(CAST(SUBSTRING_INDEX(MAX(id_pelanggan), 'P', -1) AS UNSIGNED) + 1, 3, '0') as new_id FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $this->id_pelanggan = 'P' . ($row['new_id'] ?? '001');

        $query = "INSERT INTO " . $this->table_name . " 
                SET id_pelanggan=:id_pelanggan, nama=:nama, alamat=:alamat, 
                    no_telp=:no_telp, email=:email, status_membership=:status_membership";

        $stmt = $this->conn->prepare($query);

        $this->nama = htmlspecialchars(strip_tags($this->nama));
        $this->alamat = htmlspecialchars(strip_tags($this->alamat));
        $this->no_telp = htmlspecialchars(strip_tags($this->no_telp));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->status_membership = 'Non Aktif';

        $stmt->bindParam(":id_pelanggan", $this->id_pelanggan);
        $stmt->bindParam(":nama", $this->nama);
        $stmt->bindParam(":alamat", $this->alamat);
        $stmt->bindParam(":no_telp", $this->no_telp);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":status_membership", $this->status_membership);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                SET nama=:nama, alamat=:alamat, no_telp=:no_telp, email=:email
                WHERE id_pelanggan = :id_pelanggan";

        $stmt = $this->conn->prepare($query);

        $this->nama = htmlspecialchars(strip_tags($this->nama));
        $this->alamat = htmlspecialchars(strip_tags($this->alamat));
        $this->no_telp = htmlspecialchars(strip_tags($this->no_telp));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->id_pelanggan = htmlspecialchars(strip_tags($this->id_pelanggan));

        $stmt->bindParam(":nama", $this->nama);
        $stmt->bindParam(":alamat", $this->alamat);
        $stmt->bindParam(":no_telp", $this->no_telp);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":id_pelanggan", $this->id_pelanggan);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id_pelanggan = ?";
        $stmt = $this->conn->prepare($query);
        $this->id_pelanggan = htmlspecialchars(strip_tags($this->id_pelanggan));
        $stmt->bindParam(1, $this->id_pelanggan);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function readOne() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id_pelanggan = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_pelanggan);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if($row) {
            $this->nama = $row['nama'];
            $this->alamat = $row['alamat'];
            $this->no_telp = $row['no_telp'];
            $this->email = $row['email'];
            $this->status_membership = $row['status_membership'];
            return true;
        }
        return false;
    }

    public function search($keywords) {
        $query = "SELECT * FROM " . $this->table_name . " 
                WHERE nama LIKE ? OR email LIKE ? OR id_pelanggan LIKE ?
                ORDER BY nama";
        
        $stmt = $this->conn->prepare($query);
        $keywords = htmlspecialchars(strip_tags($keywords));
        $keywords = "%{$keywords}%";
        
        $stmt->bindParam(1, $keywords);
        $stmt->bindParam(2, $keywords);
        $stmt->bindParam(3, $keywords);
        $stmt->execute();
        
        return $stmt;
    }

    public function updateMembershipStatus($id_pelanggan, $status) {
        $query = "UPDATE " . $this->table_name . " 
                SET status_membership = :status 
                WHERE id_pelanggan = :id_pelanggan";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":id_pelanggan", $id_pelanggan);
        
        return $stmt->execute();
    }

    public function getActiveMembers() {
        $query = "SELECT * FROM " . $this->table_name . " 
                WHERE status_membership = 'Aktif'
                ORDER BY nama";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function getTotalBorrowedBooks($id_pelanggan) {
        $query = "SELECT COUNT(*) as total
                FROM peminjaman p
                JOIN detail_peminjaman dp ON p.id_peminjaman = dp.id_peminjaman
                WHERE p.id_pelanggan = :id_pelanggan 
                AND dp.status_peminjaman = 'Dipinjam'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_pelanggan", $id_pelanggan);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'] ?? 0;
    }

    public function getTotalFines($id_pelanggan) {
        $query = "SELECT IFNULL(SUM(jumlah_denda), 0) as total_denda
                FROM denda
                WHERE id_pelanggan = :id_pelanggan 
                AND status_denda = 'Belum Lunas'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_pelanggan", $id_pelanggan);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total_denda'] ?? 0;
    }
}
