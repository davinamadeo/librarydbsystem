<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Buku.php';

$database = new Database();
$db = $database->getConnection();
$buku = new Buku($db);

$data = json_decode(file_get_contents("php://input"));

$buku->isbn_buku = $data->isbn_buku;
$buku->judul_buku = $data->judul_buku;
$buku->penulis = $data->penulis;
$buku->penerbit = $data->penerbit;
$buku->tahun_terbit = $data->tahun_terbit;
$buku->kategori = $data->kategori;
$buku->stock = $data->stock;
$buku->status_buku = $data->status_buku;

if($buku->update()) {
    http_response_code(200);
    echo json_encode(array("message" => "Book was updated."));
} else {
    http_response_code(503);
    echo json_encode(array("message" => "Unable to update book."));
}
