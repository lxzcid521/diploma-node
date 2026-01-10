const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "k@dimu$ic0931352544",   
    database: "urbank"
});

db.connect(err => {
    if (err) {
        console.error("Ошибка подключения к базе:", err);
        return;
    }
    console.log("Подключение к MySQL успешно!");
});

module.exports = db;
