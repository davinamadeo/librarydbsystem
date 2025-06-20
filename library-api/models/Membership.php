<?php
class Membership {
    private $conn;
    private $table_name = "membership";

    public $id_member;
    public $id_pelanggan;
    public $paket_langganan;
    public $tanggal_pembuatan;
    public $tanggal_expired;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        $query = "SELECT m.*, p.nama as nama_pelanggan,
                         CASE 
                            WHEN m.tanggal_expired >= CURDATE() THEN 'Aktif'
                            ELSE 'Expired'
                         END as status_membership
                  FROM " . $this->table_name . " m
                  LEFT JOIN pelanggan p ON m.id_pelanggan = p.id_pelanggan
                  ORDER BY m.tanggal_expired DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function create() {
        // Generate new ID
        $query = "SELECT LPAD(CAST(SUBSTRING_INDEX(MAX(id_member), 'M', -1) AS UNSIGNED) + 1, 3, '0') as new_id FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $this->id_member = 'M' . ($row['new_id'] ?? '001');

        $query = "INSERT INTO " . $this->table_name . " 
                SET id_member=:id_member, id_pelanggan=:id_pelanggan, 
                    paket_langganan=:paket_langganan, tanggal_pembuatan=:tanggal_pembuatan, 
                    tanggal_expired=:tanggal_expired";

        $stmt = $this->conn->prepare($query);

        $this->id_pelanggan = htmlspecialchars(strip_tags($this->id_pelanggan));
        $this->paket_langganan = htmlspecialchars(strip_tags($this->paket_langganan));
        $this->tanggal_pembuatan = htmlspecialchars(strip_tags($this->tanggal_pembuatan));
        $this->tanggal_expired = htmlspecialchars(strip_tags($this->tanggal_expired));

        $stmt->bindParam(":id_member", $this->id_member);
        $stmt->bindParam(":id_pelanggan", $this->id_pelanggan);
        $stmt->bindParam(":paket_langganan", $this->paket_langganan);
        $stmt->bindParam(":tanggal_pembuatan", $this->tanggal_pembuatan);
        $stmt->bindParam(":tanggal_expired", $this->tanggal_expired);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function createMembershipTransaction($id_pelanggan, $paket_langganan, $nominal, $metode_pembayaran) {
        // Generate new transaction ID
        $query = "SELECT LPAD(CAST(SUBSTRING_INDEX(MAX(id_transaksi_membership), 'TM', -1) AS UNSIGNED) + 1, 4, '0') as new_id FROM transaksi_membership";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $transaction_id = 'TM' . ($row['new_id'] ?? '0001');

        // Insert into transaksi_membership (trigger will handle membership creation)
        $query = "INSERT INTO transaksi_membership 
                SET id_transaksi_membership=:id_transaksi_membership, id_pelanggan=:id_pelanggan, 
                    tanggal_transaksi=CURDATE(), paket_langganan=:paket_langganan, 
                    nominal=:nominal, metode_pembayaran=:metode_pembayaran";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_transaksi_membership", $transaction_id);
        $stmt->bindParam(":id_pelanggan", $id_pelanggan);
        $stmt->bindParam(":paket_langganan", $paket_langganan);
        $stmt->bindParam(":nominal", $nominal);
        $stmt->bindParam(":metode_pembayaran", $metode_pembayaran);

        return $stmt->execute();
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                SET paket_langganan=:paket_langganan, tanggal_pembuatan=:tanggal_pembuatan, 
                    tanggal_expired=:tanggal_expired
                WHERE id_member = :id_member";

        $stmt = $this->conn->prepare($query);

        $this->paket_langganan = htmlspecialchars(strip_tags($this->paket_langganan));
        $this->tanggal_pembuatan = htmlspecialchars(strip_tags($this->tanggal_pembuatan));
        $this->tanggal_expired = htmlspecialchars(strip_tags($this->tanggal_expired));
        $this->id_member = htmlspecialchars(strip_tags($this->id_member));

        $stmt->bindParam(":paket_langganan", $this->paket_langganan);
        $stmt->bindParam(":tanggal_pembuatan", $this->tanggal_pembuatan);
        $stmt->bindParam(":tanggal_expired", $this->tanggal_expired);
        $stmt->bindParam(":id_member", $this->id_member);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id_member = ?";
        $stmt = $this->conn->prepare($query);
        $this->id_member = htmlspecialchars(strip_tags($this->id_member));
        $stmt->bindParam(1, $this->id_member);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function readOne() {
        $query = "SELECT m.*, p.nama as nama_pelanggan
                  FROM " . $this->table_name . " m
                  LEFT JOIN pelanggan p ON m.id_pelanggan = p.id_pelanggan
                  WHERE m.id_member = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_member);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if($row) {
            $this->id_pelanggan = $row['id_pelanggan'];
            $this->paket_langganan = $row['paket_langganan'];
            $this->tanggal_pembuatan = $row['tanggal_pembuatan'];
            $this->tanggal_expired = $row['tanggal_expired'];
            return true;
        }
        return false;
    }

    public function getByCustomer($id_pelanggan) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE id_pelanggan = :id_pelanggan
                  ORDER BY tanggal_expired DESC
                  LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_pelanggan", $id_pelanggan);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function extendMembership($id_member, $additional_months) {
        $query = "UPDATE " . $this->table_name . " 
                SET tanggal_expired = DATE_ADD(tanggal_expired, INTERVAL :months MONTH)
                WHERE id_member = :id_member";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":months", $additional_months);
        $stmt->bindParam(":id_member", $id_member);
        
        return $stmt->execute();
    }

    public function getActiveMembers() {
        $query = "SELECT m.*, p.nama as nama_pelanggan
                  FROM " . $this->table_name . " m
                  LEFT JOIN pelanggan p ON m.id_pelanggan = p.id_pelanggan
                  WHERE m.tanggal_expired >= CURDATE()
                  ORDER BY m.tanggal_expired ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function getExpiredMembers() {
        $query = "SELECT m.*, p.nama as nama_pelanggan
                  FROM " . $this->table_name . " m
                  LEFT JOIN pelanggan p ON m.id_pelanggan = p.id_pelanggan
                  WHERE m.tanggal_expired < CURDATE()
                  ORDER BY m.tanggal_expired DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function getExpiringMembers($days = 7) {
        $query = "SELECT m.*, p.nama as nama_pelanggan,
                         DATEDIFF(m.tanggal_expired, CURDATE()) as days_remaining
                  FROM " . $this->table_name . " m
                  LEFT JOIN pelanggan p ON m.id_pelanggan = p.id_pelanggan
                  WHERE m.tanggal_expired BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL :days DAY)
                  ORDER BY m.tanggal_expired ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":days", $days);
        $stmt->execute();
        return $stmt;
    }

    public function search($keywords) {
        $query = "SELECT m.*, p.nama as nama_pelanggan,
                         CASE 
                            WHEN m.tanggal_expired >= CURDATE() THEN 'Aktif'
                            ELSE 'Expired'
                         END as status_membership
                  FROM " . $this->table_name . " m
                  LEFT JOIN pelanggan p ON m.id_pelanggan = p.id_pelanggan
                  WHERE p.nama LIKE ? OR m.id_member LIKE ? OR m.paket_langganan LIKE ?
                  ORDER BY m.tanggal_expired DESC";
        
        $stmt = $this->conn->prepare($query);
        $keywords = htmlspecialchars(strip_tags($keywords));
        $keywords = "%{$keywords}%";
        
        $stmt->bindParam(1, $keywords);
        $stmt->bindParam(2, $keywords);
        $stmt->bindParam(3, $keywords);
        $stmt->execute();
        
        return $stmt;
    }

    public function getMembershipStats() {
        $query = "SELECT 
                    COUNT(*) as total_members,
                    COUNT(CASE WHEN tanggal_expired >= CURDATE() THEN 1 END) as active_members,
                    COUNT(CASE WHEN tanggal_expired < CURDATE() THEN 1 END) as expired_members,
                    COUNT(CASE WHEN paket_langganan = '1 Bulan' THEN 1 END) as basic_members,
                    COUNT(CASE WHEN paket_langganan = '3 Bulan' THEN 1 END) as premium_members,
                    COUNT(CASE WHEN paket_langganan = '6 Bulan' THEN 1 END) as vip_members
                  FROM " . $this->table_name;
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateMembershipStatus() {
        // This function calls the stored procedure to update membership status
        $query = "CALL update_status_membership()";
        $stmt = $this->conn->prepare($query);
        
        return $stmt->execute();
    }
}