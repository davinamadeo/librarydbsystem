<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';
include_once '../models/Peminjaman.php';

$database = new Database();
$db = $database->getConnection();
$peminjaman = new Peminjaman($db);

$stmt = $peminjaman->read();
$num = $stmt->rowCount();

if($num > 0) {
    $peminjaman_arr = array();
    $peminjaman_arr["records"] = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        $peminjaman_item = array(
            "id_peminjaman" => $id_peminjaman,
            "id_pelanggan" => $id_pelanggan,
            "nama_pelanggan" => $nama_pelanggan,
            "tanggal_peminjaman" => $tanggal_peminjaman,
            "tenggat_peminjaman" => $tenggat_peminjaman,
            "judul_buku" => $judul_buku,
            "status_peminjaman" => $status_peminjaman
        );
        array_push($peminjaman_arr["records"], $peminjaman_item);
    }

    http_response_code(200);
    echo json_encode($peminjaman_arr);
} else {
    http_response_code(404);
    echo json_encode(array("message" => "No borrowing records found."));
}