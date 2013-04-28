<?php

//allow access from any site (for the bookmarklets sake)
header("Access-Control-Allow-Origin: *");

//connect to the database
INCLUDE "../config/db_connection.php";

//grab data posted
$drink = $_POST['drink'];
$name = $_POST['name'];

//do the insert
$sql = "INSERT INTO `noblei6_qs`.`drank`(`drink`) VALUES ('$drink')";
mysql_query($sql);

//close the link to the db
mysql_close($link);

?>