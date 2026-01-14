const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 9988;


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "SAI@38",
    database: "mydb46"
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL Database");
});


app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 3600000 // 1 hour
    }
}));
app.get("/", (req, res) => res.render("Myhomepage"));
app.get("/SignUpPage", (req, res) => res.render("SignUpPage"));

app.post("/reg", (req, res) => {
    const { username, email, mobile, password, passoutYear, branch } = req.body;

    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) return res.send("<script>alert('Database error: " + err.message + "'); window.location='/SignUpPage';</script>");

        if (results.length > 0) {
            return res.send("<script>alert('User already exists! Please login.'); window.location='/SignUpPage';</script>");
        }
        db.query(
            "INSERT INTO users (username, email, mobile, password, passoutYear, branch) VALUES (?, ?, ?, ?, ?, ?)",
            [username, email, mobile, password, passoutYear, branch],
            (err, result) => {
                if (err) return res.send("<script>alert('Error: " + err.message + "'); window.location='/SignUpPage';</script>");
                req.session.email = email; // Store user's email in session
                req.session.username = username; // Store user's name in session
                res.redirect("/LoginPage");
            }
        );
    });
});
app.get("/LoginPage", (req, res) => res.render("LoginPage"));

// -------------------------------------------------------------------- LOGIN CREDENTIALS -------------------------------------------------------
app.post("/bat", (req, res) => {
    const { email, password } = req.body;

    db.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, results) => {
        if (err) return res.send("<script>alert('Database error: " + err.message + "'); window.location='/LoginPage';</script>");

        if (results.length > 0) {
            req.session.email = email; // Store user's email in session
            req.session.username = results[0].username; // Store username in session
            return res.redirect("/student");
        } else {
            return res.send("<script>alert('Invalid email or password! Please try again.'); window.location='/LoginPage';</script>");
        }
    });
});
// -------------------------------------------------------------------------------------------------------------------
app.get("/student", (req, res) => {
    if (!req.session.email) {
        return res.redirect("/LoginPage"); 
    }

    const userEmail = req.session.email; 
    const sql = "SELECT username FROM users WHERE email = ?"; 

    db.query(sql, [userEmail], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.send("<script>alert('Database error: " + err.message + "'); window.location='/LoginPage';</script>");
        }

        if (result.length > 0) {
            const username = result[0].username; 
            req.session.username = username; 
            const applicationCountSql = "SELECT COUNT(*) AS totalApplications FROM certificate_requests WHERE email = ?";
            db.query(applicationCountSql, [userEmail], (err, countResult) => {
                if (err) {
                    console.error("Error fetching application count:", err);
                    return res.send("<script>alert('Error fetching application count.'); window.location='/LoginPage';</script>");
                }

                const totalApplications = countResult[0].totalApplications;
                const notificationSql = "SELECT message FROM notifications ORDER BY timestamp DESC LIMIT 1"; 
                db.query(notificationSql, (err, notificationResult) => {
                    if (err) {
                        console.error("Error fetching notifications:", err);
                        return res.send("<script>alert('Error fetching notifications.'); window.location='/LoginPage';</script>");
                    }

                    const latestNotification = notificationResult.length > 0 ? notificationResult[0].message : "No new notifications.";
                    console.log("Latest Notification:", latestNotification);
                    res.render("studentDashboard", {
                        username: username,
                        totalApplications: totalApplications,
                        latestNotification: latestNotification
                    });
                });
            });
        } else {
            return res.redirect("/LoginPage"); 
        }
    });
});


// ------------------- APPLY FOR CERTIFICATES -----------------
app.get("/ApplyForCertificates", (req, res) => res.render("ApplyForCertificates"));

//  Apply for Certificate POST Route
app.post("/apply", (req, res) => {
    const { fullname, email, mobile, hallticket, passout_year, branch, apply_for, reason, collection_date } = req.body;

    if (!fullname || !email || !mobile || !hallticket || !passout_year || !branch || !apply_for || !reason || !collection_date) {
        return res.send("<script>alert('All fields are required.'); window.location='/ApplyForCertificates';</script>");
    }

    db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
        if (err) return res.send("<script>alert('Database error. Try again later.'); window.location='/ApplyForCertificates';</script>");

        if (result.length === 0) {
            return res.send("<script>alert('Email not registered. Please check and try again.'); window.location='/ApplyForCertificates';</script>");
        }

        db.query(
            "INSERT INTO certificate_requests (fullname, email, mobile, hallticket, passout_year, branch, apply_for, reason, collection_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [fullname, email, mobile, hallticket, passout_year, branch, apply_for, reason, collection_date],
            (err, result) => {
                if (err) return res.send("<script>alert('Error submitting request. Try again.'); window.location='/ApplyForCertificates';</script>");

                return res.send("<script>alert('Submission successful. Your collection date is: " + collection_date + "'); window.location='/student';</script>");
            }
        );
    });
});

app.get("/student", (req, res) => {
    if (!req.session.email) {
        return res.redirect("/LoginPage"); 
    }

    const userEmail = req.session.email;
    const sql = "SELECT username FROM users WHERE email = ?"; 

    db.query(sql, [userEmail], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.send("<script>alert('Database error: " + err.message + "'); window.location='/LoginPage';</script>");
        }
        if (result.length > 0) {
            return res.render("StudentDashboard", { username: result[0].username }); // Pass username to EJS
        } else {
            return res.redirect("/LoginPage"); //
        }
    });
});
// --------------------------------------------------------------------------------TrackStatus-----------------------------------------------
app.get('/trackstatuspage', (req, res) => {
    if (!req.session.email) {
        return res.redirect("/LoginPage"); // Ensure user is logged in
    }

    const userEmail = req.session.email; // Use session email for tracking

    const query = `
        SELECT fullname AS name, apply_for AS certificate_type, 
               request_date AS application_date, 
               COALESCE(collection_date, 'Pending') AS collection_date
        FROM certificate_requests 
        WHERE email = ?`;

    db.query(query, [userEmail], (err, results) => {
        if (err) {
            console.error('Database Query Error:', err);
            return res.send("<script>alert('Database error! Please try again later.'); window.location='/student';</script>");
        }

        return res.render('TrackStatusPage', {
            username: req.session.username,
            name: results.length > 0 ? results[0].name : 'User',
            applications: results
        });
    });
});

app.get('/instructions', (req, res) => {
    res.render('instructions');
});

app.get("/AdminLoginPage", (req, res) => {
    res.render("AdminLoginPage");
});
app.post("/admin-login", (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM admin WHERE email = ?";
    db.query(sql, [email], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            const admin = results[0];
            if (admin.password === password) {
                res.redirect("/admin-dashboard
            } else {
                res.render("AdminLoginPage", { error: "Invalid Password!" });
            }
        } else {
            res.render("AdminLoginPage", { error: "Admin not found!" });
        }
    });
});

// -----------------------------------------------------------------------ADMIN THINGS--------------------------------------------------------------------------
app.get("/admin-dashboard", (req, res) => {
    res.render("AdminDashBoard"); 
});
app.get("/get-applications", (req, res) => {
    const query = `SELECT *, collection_date FROM certificate_requests`;
    db.query(query, (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return res.json([]);
        }
        res.json(results);
    });
});
// ------------------------------------------------------------------------------------------------------------------------
app.get("/AdminSearchPage", (req, res) => {
    res.render("AdminSearchPage");
});

app.get("/search-application", (req, res) => {
    const { branch, roll } = req.query;

    if (!branch || !roll) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    const query = "SELECT fullname, hallticket, apply_for, request_date, collection_date FROM certificate_requests WHERE branch = ? AND hallticket = ?";

    db.query(query, [branch, roll], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        res.json(results); 
    });
});
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("Logout Error:", err);
            return res.send("<script>alert('Error logging out! Try again.'); window.location='/student';</script>");
        }
        res.clearCookie("connect.sid"); 
        res.redirect("/Myhomepage"); 
    });
});
app.get("/Myhomepage", (req, res) => {
    res.render("Myhomepage");  // Render the EJS file
});

app.get('/adminDashboard', (req, res) => {
    res.render('adminDashboard');
});
app.get('/notifications', (req, res) => {
    const sql = "SELECT message, timestamp FROM notifications ORDER BY timestamp DESC LIMIT 5"; // Fetch last 5 notifications
    db.query(sql, (err, result) => {
        if (err) {
            console.error("Error fetching notifications:", err);
            return res.render('AdminNotify', { notifications: [] }); // Send an empty array on error
        } 
        res.render('AdminNotify', { notifications: result });
    });
});
app.post('/api/notifications', (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: "Message cannot be empty." });
    }
    const sql = "INSERT INTO notifications (message, timestamp) VALUES (?, NOW())";
    db.query(sql, [message], (err, result) => {
        if (err) {
            console.error('Error inserting notification:', err);
            return res.status(500).json({ error: "Error saving notification." });
        } else {
            console.log('Notification added successfully.');
            return res.status(201).json({ success: "Notification posted." });
        }
    });
});
app.get('/api/notifications', (req, res) => {
    const sql = "SELECT message, timestamp FROM notifications ORDER BY timestamp DESC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching notifications:', err);
            return res.status(500).json({ error: "Error retrieving notifications." });
        }
        res.json(results);
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

