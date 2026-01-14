const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 9988;

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "mydbna"
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

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// GET route for Login Page
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

// app.get("/student", (req, res) => {
//     if (!req.session.email) {
//         return res.redirect("/LoginPage"); // Ensure user is logged in
//     }
    
//     const userEmail = req.session.email; // Get email from session
//     const sql = "SELECT username FROM users WHERE email = ?"; // Query to get the student's name

//     db.query(sql, [userEmail], (err, result) => {
//         if (err) {
//             console.error("Database error:", err);
//             return res.send("<script>alert('Database error: " + err.message + "'); window.location='/LoginPage';</script>");
//         }
//         if (result.length > 0) {
//             req.session.username = result[0].username; // Store username in session
//             const applicationCountSql = "SELECT COUNT(*) AS totalApplications FROM certificate_requests WHERE email = ?";
//             db.query(applicationCountSql, [userEmail], (err, countResult) => {
//                 if (err) {
//                     console.error("Error fetching application count:", err);
//                     return res.send("<script>alert('Error fetching application count.'); window.location='/LoginPage';</script>");
//                 }

//                 const totalApplications = countResult[0].totalApplications; 
//                 return res.render("StudentDashboard", { 
//                     username: req.session.username, 
//                     totalApplications: totalApplications 
//                 });
//             });
//         } else {
//             return res.redirect("/LoginPage"); 
//         }
//     });
// });

// -------------------------------------------------------------------------------------------------------------------
// app.get("/student", (req, res) => {
//     if (!req.session.email) {
//         return res.redirect("/LoginPage"); // Ensure user is logged in
//     }

//     const userEmail = req.session.email; // Get email from session

//     // Query to get the student's name
//     const sql = "SELECT username FROM users WHERE email = ?"; 

//     db.query(sql, [userEmail], (err, result) => {
//         if (err) {
//             console.error("Database error:", err);
//             return res.send("<script>alert('Database error: " + err.message + "'); window.location='/LoginPage';</script>");
//         }

//         if (result.length > 0) {
//             const username = result[0].username; // Get username
//             req.session.username = username; // Store username in session

//             // Query to get the total number of applications
//             const applicationCountSql = "SELECT COUNT(*) AS totalApplications FROM certificate_requests WHERE email = ?";
//             db.query(applicationCountSql, [userEmail], (err, countResult) => {
//                 if (err) {
//                     console.error("Error fetching application count:", err);
//                     return res.send("<script>alert('Error fetching application count.'); window.location='/LoginPage';</script>");
//                 }

//                 const totalApplications = countResult[0].totalApplications;

//                 // ✅ Fetch the latest notification (Fixed the 'created_at' issue)
//                 const notificationSql = "SELECT message FROM notifications ORDER BY timestamp DESC LIMIT 1"; 
//                 db.query(notificationSql, (err, notificationResult) => {
//                     if (err) {
//                         console.error("Error fetching notifications:", err);
//                         return res.send("<script>alert('Error fetching notifications.'); window.location='/LoginPage';</script>");
//                     }

//                     const latestNotification = notificationResult.length > 0 ? notificationResult[0].message : "No new notifications.";

//                     // ✅ Print the notification in the server console
//                     console.log("Latest Notification:", latestNotification);

//                     // ✅ Render the Student Dashboard and send data
//                     res.render("studentDashboard", {
//                         username: username,
//                         totalApplications: totalApplications,
//                         latestNotification: latestNotification
//                     });
//                 });
//             });
//         } else {
//             return res.redirect("/LoginPage"); 
//         }
//     });
// });

app.get("/student", (req, res) => {
    if (!req.session.email) {
        return res.redirect("/LoginPage"); // Ensure user is logged in
    }

    const userEmail = req.session.email; // Get email from session

    // Query to get the student's name
    const sql = "SELECT username FROM users WHERE email = ?"; 

    db.query(sql, [userEmail], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.send("<script>alert('Database error: " + err.message + "'); window.location='/LoginPage';</script>");
        }

        if (result.length > 0) {
            const username = result[0].username; // Get username
            req.session.username = username; // Store username in session

            // Query to get the total number of applications
            const applicationCountSql = "SELECT COUNT(*) AS totalApplications FROM certificate_requests WHERE email = ?";
            db.query(applicationCountSql, [userEmail], (err, countResult) => {
                if (err) {
                    console.error("Error fetching application count:", err);
                    return res.send("<script>alert('Error fetching application count.'); window.location='/LoginPage';</script>");
                }

                const totalApplications = countResult[0].totalApplications;

                // ✅ Fetch the last **two** notifications
                const notificationSql = "SELECT message FROM notifications ORDER BY timestamp DESC LIMIT 2"; 
                db.query(notificationSql, (err, notificationResult) => {
                    if (err) {
                        console.error("Error fetching notifications:", err);
                        return res.send("<script>alert('Error fetching notifications.'); window.location='/LoginPage';</script>");
                    }

                    // Extract notifications or set default text
                    const notifications = notificationResult.map(row => row.message);
                    while (notifications.length < 2) notifications.push("No new notifications."); // Ensure two notifications

                    console.log("Latest Notifications:", notifications);

                    // ✅ Render the Student Dashboard and send the two latest notifications
                    res.render("studentDashboard", {
                        username: username,
                        totalApplications: totalApplications,
                        notifications: notifications // Send both notifications
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

// Consolidated Student Route
app.get("/student", (req, res) => {
    if (!req.session.email) {
        return res.redirect("/LoginPage"); 
        // Ensure user is logged in
    }

    const userEmail = req.session.email;
     // Get email from session
    const sql = "SELECT username FROM users WHERE email = ?"; // Query to get the student's name

    db.query(sql, [userEmail], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.send("<script>alert('Database error: " + err.message + "'); window.location='/LoginPage';</script>");
        }
        if (result.length > 0) {
            return res.render("StudentDashboard", { username: result[0].username }); // Pass username to EJS
        } else {
            return res.redirect("/LoginPage"); // Redirect if no user found
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

// --------------------------------------------------------------------------ADMIN ----------------------------------------------------------------------------

app.get("/AdminLoginPage", (req, res) => {
    res.render("AdminLoginPage");
});

// Handle Admin Login Submission
app.post("/admin-login", (req, res) => {
    const { email, password } = req.body;

    // Check if admin exists in the database
    const sql = "SELECT * FROM admin WHERE email = ?";
    db.query(sql, [email], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            const admin = results[0];

            //  Check password (direct comparison since bcrypt is not used)
            if (admin.password === password) {
                res.redirect("/admin-dashboard"); //  Redirecting to Admin Dashboard
            } else {
                res.render("AdminLoginPage", { error: "Invalid Password!" });
            }
        } else {
            res.render("AdminLoginPage", { error: "Admin not found!" });
        }
    });
});

// -----------------------------------------------------------------------ADMIN THINGS--------------------------------------------------------------------------

// Render Admin Dashboard Page
app.get("/admin-dashboard", (req, res) => {
    res.render("AdminDashBoard"); //  Ensure "AdminDashBoard.ejs" exists in "views" folder
});

//  Fetch all applications
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

//  Search application by Roll Number
app.get("/AdminSearchPage", (req, res) => {
    res.render("AdminSearchPage"); // Ensure "AdminSearchPage.ejs" exists in the "views" folder
});

// app.get("/search-application", (req, res) => {
//     const { branch, roll } = req.query;
    
//     if (!branch || !roll) {
//         return res.status(400).json({ error: "Missing parameters" });
//     }

//     const query = "SELECT fullname, hallticket, apply_for, request_date, collection_date FROM certificate_requests WHERE branch = ? AND hallticket = ?";
    
//     db.query(query, [branch, roll], (err, results) => {
//         if (err) {
//             console.error("Database error:", err);
//             return res.status(500).json({ error: "Database error" });
//         }

//         if (results.length === 0) {
//             return res.json(null);
//         }

//         res.json(results[0]);
//     });
// });

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

        res.json(results); // Send all applications
    });
});



app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("Logout Error:", err);
            return res.send("<script>alert('Error logging out! Try again.'); window.location='/student';</script>");
        }
        res.clearCookie("connect.sid"); // Clears session cookie
        res.redirect("/Myhomepage"); // Redirect to homepage after logout
    });
});
app.get("/Myhomepage", (req, res) => {
    res.render("Myhomepage");  // Render the EJS file
});

app.get('/adminDashboard', (req, res) => {
    res.render('adminDashboard');
});
// ---------------------------------------------------------------
// app.get('/notifications', (req, res) => {
//     res.render('AdminNotify'); 
// });

// app.post('/api/notifications', (req, res) => {
//     const { message } = req.body;
//     if (!message) {
//         return res.status(400).json({ error: "Message cannot be empty." });
//     }

//     const sql = "INSERT INTO notifications (message, timestamp) VALUES (?, NOW())";
//     db.query(sql, [message], (err, result) => {
//         if (err) {
//             console.error('Error inserting notification:', err);
//             return res.status(500).json({ error: "Error saving notification." });
//         } else {
//             console.log('Notification added successfully.');
//             return res.status(201).json({ success: "Notification posted." });
//         }
//     });
// });
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

// **API Route to Add a Notification**
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

// **API Route to Fetch All Notifications**
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

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

