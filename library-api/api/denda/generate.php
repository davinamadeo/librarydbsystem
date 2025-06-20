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

if($denda->generateDendaOtomatis()) {
    http_response_code(200);
    echo json_encode(array("message" => "Automatic fines generated successfully."));
} else {
    http_response_code(503);
    echo json_encode(array("message" => "Unable to generate automatic fines."));
}