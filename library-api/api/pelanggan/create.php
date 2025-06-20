<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Pelanggan.php';

$database = new Database();
$db = $database->getConnection();
$pelanggan = new Pelanggan($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->nama)) {
    $pelanggan->nama = $data->nama;
    $pelanggan->alamat = $data->alamat;
    $pelanggan->no_telp = $data->no_telp;
    $pelanggan->email = $data->email;

    if($pelanggan->create()) {
        http_response_code(201);
        echo json_encode(array("message" => "Customer was created.", "id" => $pelanggan->id_pelanggan));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to create customer."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to create customer. Data is incomplete."));
}