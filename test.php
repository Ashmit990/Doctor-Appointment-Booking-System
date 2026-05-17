<?php
session_start();
$_SESSION['user_id']=1;
$_SESSION['role']='Admin';
$_GET['period']='all';
chdir('api/admin');
include 'patient_activity.php';
