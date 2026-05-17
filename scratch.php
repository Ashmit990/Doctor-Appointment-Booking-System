<?php
session_start();
$_SESSION['user_id']=1;
$_SESSION['role']='Admin';
$_GET['period']='all';
include 'api/admin/patient_activity.php';
