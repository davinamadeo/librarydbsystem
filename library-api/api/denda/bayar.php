<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Denda.php';

$database = new Database();
$db = $database->getConnection();
$denda = new Denda($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id_denda) && !empty($data->metode_transaksi)) {
    if($denda->bayarDenda($data->id_denda, $data->metode_transaksi)) {
        http_response_code(200);
        echo json_encode(array("message" => "Fine payment was processed successfully."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to process fine payment."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to process payment. Data is incomplete."));
}