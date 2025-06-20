<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Membership.php';

$database = new Database();
$db = $database->getConnection();
$membership = new Membership($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id_pelanggan) && !empty($data->paket_langganan) && !empty($data->nominal) && !empty($data->metode_pembayaran)) {
    if($membership->createMembershipTransaction($data->id_pelanggan, $data->paket_langganan, $data->nominal, $data->metode_pembayaran)) {
        http_response_code(201);
        echo json_encode(array("message" => "Membership was created successfully."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to create membership."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to create membership. Data is incomplete."));
}