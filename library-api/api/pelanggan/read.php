<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';
include_once '../models/Pelanggan.php';

$database = new Database();
$db = $database->getConnection();
$pelanggan = new Pelanggan($db);

if(isset($_GET['search'])) {
    $stmt = $pelanggan->search($_GET['search']);
} else {
    $stmt = $pelanggan->read();
}

$num = $stmt->rowCount();

if($num > 0) {
    $pelanggan_arr = array();
    $pelanggan_arr["records"] = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        $pelanggan_item = array(
            "id_pelanggan" => $id_pelanggan,
            "nama" => $nama,
            "alamat" => $alamat,
            "no_telp" => $no_telp,
            "email" => $email,
            "status_membership" => $status_membership
        );
        array_push($pelanggan_arr["records"], $pelanggan_item);
    }

    http_response_code(200);
    echo json_encode($pelanggan_arr);
} else {
    http_response_code(404);
    echo json_encode(array("message" => "No customers found."));
}