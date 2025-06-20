<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Peminjaman.php';

$database = new Database();
$db = $database->getConnection();
$peminjaman = new Peminjaman($db);

$data = json_decode(file_get_contents("php://input"));

if($peminjaman->kembalikanBuku($data->id_detail_peminjaman)) {
    http_response_code(200);
    echo json_encode(array("message" => "Book was returned successfully."));
} else {
    http_response_code(503);
    echo json_encode(array("message" => "Unable to return book."));
}