<?php
switch($path) {
    case '/api/dashboard':
        if($method == 'GET') include 'api/dashboard.php';
        break;
    case '/api/buku':
        if($method == 'GET') include 'api/buku/read.php';
        if($method == 'POST') include 'api/buku/create.php';
        if($method == 'PUT') include 'api/buku/update.php';
        if($method == 'DELETE') include 'api/buku/delete.php';
        break;
    case '/api/pelanggan':
        if($method == 'GET') include 'api/pelanggan/read.php';
        if($method == 'POST') include 'api/pelanggan/create.php';
        break;
    case '/api/peminjaman':
        if($method == 'GET') include 'api/peminjaman/read.php';
        if($method == 'POST') include 'api/peminjaman/create.php';
        break;
    case '/api/peminjaman/return':
        if($method == 'PUT') include 'api/peminjaman/return.php';
        break;
    case '/api/denda':
        if($method == 'GET') include 'api/denda/read.php';
        break;
    case '/api/denda/bayar':
        if($method == 'POST') include 'api/denda/bayar.php';
        break;
    case '/api/denda/generate':
        if($method == 'POST') include 'api/denda/generate.php';
        break;
    case '/api/membership':
        if($method == 'GET') include 'api/membership/read.php';
        if($method == 'POST') include 'api/membership/create.php';
        break;
    default:
        http_response_code(404);
        echo json_encode(array("message" => "Endpoint not found."));
        break;
}
?>