<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';
include_once '../models/Membership.php';

$database = new Database();
$db = $database->getConnection();
$membership = new Membership($db);

$stmt = $membership->read();
$num = $stmt->rowCount();

if($num > 0) {
    $membership_arr = array();
    $membership_arr["records"] = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        $membership_item = array(
            "id_member" => $id_member,
            "id_pelanggan" => $id_pelanggan,
            "nama_pelanggan" => $nama_pelanggan,
            "paket_langganan" => $paket_langganan,
            "tanggal_pembuatan" => $tanggal_pembuatan,
            "tanggal_expired" => $tanggal_expired,
            "status_membership" => $status_membership
        );
        array_push($membership_arr["records"], $membership_item);
    }

    http_response_code(200);
    echo json_encode($membership_arr);
} else {
    http_response_code(404);
    echo json_encode(array("message" => "No membership records found."));
}