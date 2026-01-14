 
const express = require("express");
const path = require("path");
const con = require("./mydb"); // Import the database connection
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 9988;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------Home Page Route-------------
app.get("/", (req, res) => res.render("Myhomepage"));

// ---------------------SignUpPage------------------
app.get("/SignUpPage", (req, res) => res.render("SignUpPage"));

// ---------------Student Registration Route------------
app.post("/reg", (req, res) => {
    const { username, email, mobile, password, passoutYear, branch } = req.body;

    con.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) return res.send("Database error: " + err.message);

        if (results.length > 0) {
            return res.send("<script>alert('User already exists! Please login.'); window.location='/SignUpPage';</script>");
        }

        con.query(
            "INSERT INTO users (username, email, mobile, password, passoutYear, branch) VALUES (?, ?, ?, ?, ?, ?)",
            [username, email, mobile, password, passoutYear, branch],
            (err, result) => {
                if (err) return res.send("Error: " + err.message);
                res.redirect("/LoginPage");
            }
        );
    });
});

// ✅ GET route to ensure LoginPage is accessible
app.get("/LoginPage", (req, res) => res.render("LoginPage"));

// -------------------- LOGIN CREDENTIALS ----------- 
app.post("/bat", (req, res) => {
    const { email, password } = req.body;

    con.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, results) => {
        if (err) return res.send("Database error: " + err.message);

        if (results.length > 0) {
            res.render("StudentDashboard", { username: results[0].username });
        } else {
            res.send("<script>alert('Invalid email or password! Please try again.'); window.location='/LoginPage';</script>");
        }
    });
});

app.get("/LoginPage", (req, res) => res.render("LoginPage"));

// -------------------CERTIFICATES ---------
app.get("/ApplyForCertificates", (req, res) => res.render("ApplyForCertificates"));

// 🟢 Apply for Certificate POST Route
app.post("/apply", (req, res) => {
    const { fullname, email, mobile, hallticket, passout_year, branch, apply_for, reason, collection_date } = req.body;

    if (!fullname || !email || !mobile || !hallticket || !passout_year || !branch || !apply_for || !reason || !collection_date) {
        return res.send("<script>alert('All fields are required.'); window.location='/ApplyForCertificates';</script>");
    }

    con.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
        if (err) return res.send("<script>alert('Database error. Try again later.'); window.location='/ApplyForCertificates';</script>");

        if (result.length === 0) {
            return res.send("<script>alert('Email not registered. Please check and try again.'); window.location='/ApplyForCertificates';</script>");
        }

        console.log("Inserting data:", { fullname, email, mobile, hallticket, passout_year, branch, apply_for, reason, collection_date });

        con.query(
            "INSERT INTO certificate_requests (fullname, email, mobile, hallticket, passout_year, branch, apply_for, reason, collection_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [fullname, email, mobile, hallticket, passout_year, branch, apply_for, reason, collection_date],
            (err, result) => {
                if (err) return res.send("<script>alert('Error submitting request. Try again.'); window.location='/ApplyForCertificates';</script>");

                console.log("Certificate request submitted successfully");
                res.send("<script>alert('Submission successful. Your collection date is: " + collection_date + "'); window.location='/student';</script>");
                res.redirect("/student-dashboard");
            }
        );
    });
});

app.get("/student", (req, res) => res.render("StudentDashboard"));
// ------------


// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
















// const express = require("express");
// const path = require("path");
// const mysql = require("mysql2");

// const app = express();
// const PORT = process.env.PORT || 9988;

// // ✅ Create MySQL Database Connection
// const db = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "SAI@38",
//     database: "mydb46"
// });

// db.connect((err) => {
//     if (err) {
//         console.error("Database connection failed:", err);
//         return;
//     }
//     console.log("Connected to MySQL Database");
// });

// // ✅ Set up EJS Views
// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));

// // ✅ Static Files Middleware
// app.use(express.static("public"));
// app.use(express.static(path.join(__dirname, "public")));

// // ✅ Middleware for Parsing Request Body
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ------------------- Home Page Route -------------
// app.get("/", (req, res) => res.render("Myhomepage"));

// // ------------------- SignUp Page ------------------
// app.get("/SignUpPage", (req, res) => res.render("SignUpPage"));

// // ------------------- Student Registration Route ------------
// app.post("/reg", (req, res) => {
//     const { username, email, mobile, password, passoutYear, branch } = req.body;

//     db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
//         if (err) return res.send("Database error: " + err.message);

//         if (results.length > 0) {
//             return res.send("<script>alert('User already exists! Please login.'); window.location='/SignUpPage';</script>");
//         }

//         db.query(
//             "INSERT INTO users (username, email, mobile, password, passoutYear, branch) VALUES (?, ?, ?, ?, ?, ?)",
//             [username, email, mobile, password, passoutYear, branch],
//             (err, result) => {
//                 if (err) return res.send("Error: " + err.message);
//                 res.redirect("/LoginPage");
//             }
//         );
//     });
// });

// // ✅ GET route for Login Page
// app.get("/LoginPage", (req, res) => res.render("LoginPage"));

// // ------------------- LOGIN CREDENTIALS -----------------
// app.post("/bat", (req, res) => {
//     const { email, password } = req.body;

//     db.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, results) => {
//         if (err) return res.send("Database error: " + err.message);

//         if (results.length > 0) {
//             res.render("StudentDashboard", { username: results[0].username });
//         } else {
//             res.send("<script>alert('Invalid email or password! Please try again.'); window.location='/LoginPage';</script>");
//         }
//     });
// });

// // ------------------- APPLY FOR CERTIFICATES -----------------
// app.get("/ApplyForCertificates", (req, res) => res.render("ApplyForCertificates"));

// // 🟢 Apply for Certificate POST Route
// app.post("/apply", (req, res) => {
//     const { fullname, email, mobile, hallticket, passout_year, branch, apply_for, reason, collection_date } = req.body;

//     if (!fullname || !email || !mobile || !hallticket || !passout_year || !branch || !apply_for || !reason || !collection_date) {
//         return res.send("<script>alert('All fields are required.'); window.location='/ApplyForCertificates';</script>");
//     }

//     db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
//         if (err) return res.send("<script>alert('Database error. Try again later.'); window.location='/ApplyForCertificates';</script>");

//         if (result.length === 0) {
//             return res.send("<script>alert('Email not registered. Please check and try again.'); window.location='/ApplyForCertificates';</script>");
//         }

//         console.log("Inserting data:", { fullname, email, mobile, hallticket, passout_year, branch, apply_for, reason, collection_date });

//         db.query(
//             "INSERT INTO certificate_requests (fullname, email, mobile, hallticket, passout_year, branch, apply_for, reason, collection_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
//             [fullname, email, mobile, hallticket, passout_year, branch, apply_for, reason, collection_date],
//             (err, result) => {
//                 if (err) return res.send("<script>alert('Error submitting request. Try again.'); window.location='/ApplyForCertificates';</script>");

//                 console.log("Certificate request submitted successfully");
//                 res.send("<script>alert('Submission successful. Your collection date is: " + collection_date + "'); window.location='/student';</script>");
//             }
//         );
//     });
// });

// app.get("/student", (req, res) => res.render("StudentDashboard"));

// // -------------TrackSatutes
// // app.get('/TrackStatusPage', (req, res) => {
// //     const userEmail = req.query.email; // Get email from query parameter
    
// //     if (!userEmail) {
// //         return res.status(400).json({ message: 'Email is required' });
// //     }
    
// //     const query = "SELECT username, apply_for AS certificate_type, request_date AS application_date, collection_date FROM certificate_requests WHERE email = ?";
    
// //     db.query(query, [userEmail], (err, results) => {
// //         if (err) {
// //             console.error('Error fetching certificate requests:', err);
// //             return res.status(500).json({ message: 'Database error' });
// //         }
        
// //         res.render('TrackStatusPage', {
// //             name: results.length > 0 ? results[0].username : 'User',
// //             applications: results
// //         });
// //     });
// // });

// app.get('/trackstatuspage', (req, res) => {
//     const userEmail = req.query.email; // Get email from query parameter

//     if (!userEmail) {
//         return res.status(400).json({ message: 'Email is required' });
//     }

//     const query = `
//         SELECT fullname AS name, apply_for AS certificate_type, 
//                request_date AS application_date, collection_date 
//         FROM certificate_requests 
//         WHERE email = ?`;

//     db.query(query, [userEmail], (err, results) => {
//         if (err) {
//             console.error('Error fetching certificate requests:', err);
//             return res.status(500).json({ message: 'Database error' });
//         }

//         console.log("Query Results:", results); // Debugging line

//         res.render('TrackStatusPage', {
//             name: results.length > 0 ? results[0].name : 'User',
//             applications: results.length > 0 ? results : []
//         });
//     });
// });

// app.get('/instructions', (req, res) => {
//     res.render('instructions');
// });


// app.get("/student", (req, res) => {
//     if (!req.session.email) {
//         return res.redirect("/login"); // Ensure user is logged in
//     }

//     const userEmail = req.session.email; // Get email from session
//     const sql = "SELECT name FROM students WHERE email = ?"; // Query to get the student's name

//     db.query(sql, [userEmail], (err, result) => {
//         if (err) {
//             console.error("Database error:", err);
//             return res.status(500).send("Database error");
//         }
//         if (result.length > 0) {
//             console.log("User name fetched:", result[0].name); // Debugging log
//             res.render("StudentDashboard", { name: result[0].name }); // Pass name to EJS
//         } else {
//             console.log("No user found for email:", userEmail);
//             res.redirect("/login"); // Redirect if no user found
//         }
//     });
// });


// app.get('/trackstatuspage', (req, res) => {
//     const userEmail = req.query.email;

//     if (!userEmail) {
//         return res.send("<script>alert('⚠️ Please enter your registered email!'); window.location='/student';</script>");
//     }

//     const query = `
//         SELECT fullname AS name, apply_for AS certificate_type, 
//                request_date AS application_date, 
//                COALESCE(collection_date, 'Pending') AS collection_date
//         FROM certificate_requests 
//         WHERE email = ?`;

//     db.query(query, [userEmail], (err, results) => {
//         if (err) {
//             console.error('❌ Database Query Error:', err);
//             return res.send("<script>alert('⚠️ Database error! Please try again later.'); window.location='/student';</script>");
//         }

//         console.log("✅ Query Results:", results); // Debugging log

//         // Render the page with results or show "No applications found"
//         res.render('TrackStatusPage', {
//             name: results.length > 0 ? results[0].name : 'User',
//             applications: results
//         });
//     });
// });







// // Start the server

// // ✅ Start Server
// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));








