<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';
include_once '../models/Denda.php';

$database = new Database();
$db = $database->getConnection();
$denda = new Denda($db);

$stmt = $denda->read();
$num = $stmt->rowCount();

if($num > 0) {
    $denda_arr = array();
    $denda_arr["records"] = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        $denda_item = array(
            "id_denda" => $id_denda,
            "id_pelanggan" => $id_pelanggan,
            "nama_pelanggan" => $nama_pelanggan,
            "jumlah_hari_telat" => $jumlah_hari_telat,
            "jumlah_denda" => $jumlah_denda,
            "status_denda" => $status_denda
        );
        array_push($denda_arr["records"], $denda_item);
    }

    http_response_code(200);
    echo json_encode($denda_arr);
} else {
    http_response_code(404);
    echo json_encode(array("message" => "No fines found."));
}
