<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['action'] = 'contacts';
session_start();
$_SESSION['user_id'] = 2; // user
$_SESSION['role'] = 'user';
ob_start();
include 'api/messages.php';
$out = ob_get_clean();
echo $out;
