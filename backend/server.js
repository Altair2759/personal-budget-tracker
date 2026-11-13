const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const collection = require("./models/User");

const app = express();

app.use(express.json());

//Express finds the public folder for all images and styles and what frontend wil be using
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.urlencoded({ extended: false }));

//Express finds the pages inside the views as ejs files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../view"));


// Routing the pages
//Login page route
app.get("/", (req, res) => {
    res.render("login");
});

//Register page route
app.get("/register", (req, res) => {
    res.render("register");
});

//Dashboard page route
app.get("/dashboard", (req, res) => {
    res.render("dashboard", { currentPage: "dashboard"  });
});

//Transactions page route
app.get("/transactions", (req, res) => {
    res.render("transactions", { currentPage: "transactions"  });
});

//Category page route
app.get("/category", (req, res) => {
    res.render("category", { currentPage: "category"  });
});

//budget page route
app.get("/budget", (req, res) => {
    res.render("budget", { currentPage: "budget"  });
});

//Handles the register page 
app.post("/register", async (req, res) => {
    const data = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    }

    const existingUser = await collection.findOne({ username: data.username });

    if (existingUser) {
        res.send('User already exists. Please choose a different username.')
    }else {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashedPassword;

        await collection.create(data);
        console.log("User registered", data.username);

        res.redirect("/dashboard");
    }
});

//handles the login page 
app.post("/login", async (req, res) => {
    try {
        const check = await collection.findOne({ username: req.body.username });
        if (!check) {
            res.send("user name cannot found")
        }else {
            res.redirect("/dashboard");
        }
    }catch {
        res.send("wrong Details")
    }
});


const port = 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});

