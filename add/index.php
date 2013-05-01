<?php

//allow access from any site (for the bookmarklets sake)
header("Access-Control-Allow-Origin: *");

//connect to the database
INCLUDE "../config/db_connection.php";

//grab data posted
$drink = $_POST['drink'];
$name = $_POST['name'];
$session = $_POST['session'];

echo $session;

$validated = false;

if ($session == 'testing') {
	$validated = true;
	echo "user vaildated";
} else {
	$validated = false;
	echo "wrong user";
}

if($validated){ 
	//do the insert
	$sql = "INSERT INTO `noblei6_qs`.`drank`(`drink`) VALUES ('$drink')";
	mysql_query($sql);

	echo "insert completed";
} else {
	echo "insert not attempted";
}


//close the link to the db
mysql_close($link);

?>