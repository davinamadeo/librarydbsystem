<?php
// models/Buku.php
class Buku {
    private $conn;
    private $table_name = "buku";

    public $isbn_buku;
    public $judul_buku;
    public $penulis;
    public $penerbit;
    public $tahun_terbit;
    public $kategori;
    public $stock;
    public $status_buku;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY judul_buku";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                SET isbn_buku=:isbn_buku, judul_buku=:judul_buku, penulis=:penulis, 
                    penerbit=:penerbit, tahun_terbit=:tahun_terbit, kategori=:kategori, 
                    stock=:stock, status_buku=:status_buku";

        $stmt = $this->conn->prepare($query);

        $this->isbn_buku = htmlspecialchars(strip_tags($this->isbn_buku));
        $this->judul_buku = htmlspecialchars(strip_tags($this->judul_buku));
        $this->penulis = htmlspecialchars(strip_tags($this->penulis));
        $this->penerbit = htmlspecialchars(strip_tags($this->penerbit));
        $this->tahun_terbit = htmlspecialchars(strip_tags($this->tahun_terbit));
        $this->kategori = htmlspecialchars(strip_tags($this->kategori));
        $this->stock = htmlspecialchars(strip_tags($this->stock));
        $this->status_buku = htmlspecialchars(strip_tags($this->status_buku));

        $stmt->bindParam(":isbn_buku", $this->isbn_buku);
        $stmt->bindParam(":judul_buku", $this->judul_buku);
        $stmt->bindParam(":penulis", $this->penulis);
        $stmt->bindParam(":penerbit", $this->penerbit);
        $stmt->bindParam(":tahun_terbit", $this->tahun_terbit);
        $stmt->bindParam(":kategori", $this->kategori);
        $stmt->bindParam(":stock", $this->stock);
        $stmt->bindParam(":status_buku", $this->status_buku);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                SET judul_buku=:judul_buku, penulis=:penulis, penerbit=:penerbit, 
                    tahun_terbit=:tahun_terbit, kategori=:kategori, stock=:stock, 
                    status_buku=:status_buku
                WHERE isbn_buku = :isbn_buku";

        $stmt = $this->conn->prepare($query);

        $this->judul_buku = htmlspecialchars(strip_tags($this->judul_buku));
        $this->penulis = htmlspecialchars(strip_tags($this->penulis));
        $this->penerbit = htmlspecialchars(strip_tags($this->penerbit));
        $this->tahun_terbit = htmlspecialchars(strip_tags($this->tahun_terbit));
        $this->kategori = htmlspecialchars(strip_tags($this->kategori));
        $this->stock = htmlspecialchars(strip_tags($this->stock));
        $this->status_buku = htmlspecialchars(strip_tags($this->status_buku));
        $this->isbn_buku = htmlspecialchars(strip_tags($this->isbn_buku));

        $stmt->bindParam(":judul_buku", $this->judul_buku);
        $stmt->bindParam(":penulis", $this->penulis);
        $stmt->bindParam(":penerbit", $this->penerbit);
        $stmt->bindParam(":tahun_terbit", $this->tahun_terbit);
        $stmt->bindParam(":kategori", $this->kategori);
        $stmt->bindParam(":stock", $this->stock);
        $stmt->bindParam(":status_buku", $this->status_buku);
        $stmt->bindParam(":isbn_buku", $this->isbn_buku);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE isbn_buku = ?";
        $stmt = $this->conn->prepare($query);
        $this->isbn_buku = htmlspecialchars(strip_tags($this->isbn_buku));
        $stmt->bindParam(1, $this->isbn_buku);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function readOne() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE isbn_buku = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->isbn_buku);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if($row) {
            $this->judul_buku = $row['judul_buku'];
            $this->penulis = $row['penulis'];
            $this->penerbit = $row['penerbit'];
            $this->tahun_terbit = $row['tahun_terbit'];
            $this->kategori = $row['kategori'];
            $this->stock = $row['stock'];
            $this->status_buku = $row['status_buku'];
            return true;
        }
        return false;
    }

    public function search($keywords) {
        $query = "SELECT * FROM " . $this->table_name . " 
                WHERE judul_buku LIKE ? OR penulis LIKE ? OR isbn_buku LIKE ?
                ORDER BY judul_buku";
        
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
