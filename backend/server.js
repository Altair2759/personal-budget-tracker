const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const collection = require("./models/User");

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../view"));

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});


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

        res.render("dashboard");
    }
});


app.post("/login", async (req, res) => {
    try {
        const check = await collection.findOne({ username: req.body.username });
        if (!check) {
            res.send("user name cannot found")
        }else {
            res.render("dashboard");
        }
    }catch {
        res.send("wrong Details")
    }
});


const port = 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});

