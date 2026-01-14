const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost', // Change if your database is hosted elsewhere
    user: 'root',
    password: 'SAI@38',
    database: 'mydb46'
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL Database");
});
