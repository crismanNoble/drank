<?php

//allow access from any site (for the bookmarklets sake)
header("Access-Control-Allow-Origin: *");

//connect to the database
INCLUDE "../config/db_connection.php";

//grab data posted
$drink = $_POST['drink'];

//look for some datas
$sql_total = "SELECT * FROM `noblei6_qs`.`drank` WHERE `drink` = '$drink'";
$result_total = mysql_query($sql_total);
$total = mysql_num_rows($result_total);

$sql_daily_total = "SELECT * FROM `noblei6_qs`.`drank` WHERE `timestamp` > CURDATE() AND `drink` = '$drink'";
$result_daily_total = mysql_query($sql_daily_total);
$daily_total = mysql_num_rows($result_daily_total);

print '{"total":'.$total.',"daily":'.$daily_total.'}';

//close the link to the db
mysql_close($link);

?>