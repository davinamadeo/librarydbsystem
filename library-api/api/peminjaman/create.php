<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Peminjaman.php';

$database = new Database();
$db = $database->getConnection();
$peminjaman = new Peminjaman($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id_pelanggan) && !empty($data->isbn_buku)) {
    try {
        $db->beginTransaction();
        
        $peminjaman->id_pelanggan = $data->id_pelanggan;
        $peminjaman->tanggal_peminjaman = $data->tanggal_peminjaman;
        $peminjaman->tenggat_peminjaman = $data->tenggat_peminjaman;

        if($peminjaman->create()) {
            // Add detail peminjaman
            if($peminjaman->addDetailPeminjaman($data->isbn_buku)) {
                $db->commit();
                http_response_code(201);
                echo json_encode(array("message" => "Borrowing was created.", "id" => $peminjaman->id_peminjaman));
            } else {
                $db->rollback();
                http_response_code(503);
                echo json_encode(array("message" => "Unable to create borrowing detail."));
            }
        } else {
            $db->rollback();
            http_response_code(503);
            echo json_encode(array("message" => "Unable to create borrowing."));
        }
    } catch(Exception $e) {
        $db->rollback();
        http_response_code(503);
        echo json_encode(array("message" => "Unable to create borrowing.", "error" => $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to create borrowing. Data is incomplete."));
}