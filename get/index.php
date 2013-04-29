<?php

//allow access from any site (for the bookmarklets sake)
header("Access-Control-Allow-Origin: *");

//connect to the database
INCLUDE "../config/db_connection.php";

//grab data posted
$drink = $_POST['drink'];

//do the insert
$sql = "SELECT * FROM `noblei6_qs`.`drank` WHERE `drink` = '$drink'";
$result = mysql_query($sql);
print mysql_num_rows($result);

//close the link to the db
mysql_close($link);

?>