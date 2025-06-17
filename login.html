<?php
// Koneksi ke database MySQL
$conn = mysqli_connect("localhost", "root", "", "Web Portal");

// Cek koneksi
if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Koneksi gagal"]));
}

// Ambil data dari request
$Email = $_POST['Email'];
$Password = $_POST['Password'];

// Query cek user
$sql = "SELECT * FROM Pengguna WHERE email='$Email' AND password='$Password'";
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    echo json_encode(["success" => true, "message" => "Login berhasil!"]);
} else {
    echo json_encode(["success" => false, "message" => "Username/email atau password salah!"]);
}
$conn->close();
?>
