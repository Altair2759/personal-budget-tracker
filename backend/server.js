const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const {Usercollection, Categorycollection, Transactioncollection} = require("./models/User");

const app = express();

app.use(express.json());

app.use(session({
    secret: "My-secret-code",
    resave: false,
    saveUninitialized: false
}));

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
app.get("/transactions", async (req, res) => {
    const transactions = await Transactioncollection.find({userId: req.session.userId}).populate("categoryId");
    res.render("transactions", { currentPage: "transactions",  transactions: transactions});
});

app.get("/transaction/add", async (req, res) => {
    const categories = await Categorycollection.find({userId: req.session.userId});
    res.render("transaction-form", {  transaction: null,  categories: categories});
});


//Category page route
app.get("/category", async (req, res) => {
    const categories = await Categorycollection.find({userId: req.session.userId});
    res.render("category", { currentPage: "category", categories: categories  });
});


app.get("/category/add", (req, res) => {
    res.render("category-form", {  category: null });
});

app.get("/category/edit/:id", async (req, res) => {
    const category = await Categorycollection.findById(req.params.id);
    res.render("category-form", { category: category  });
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

    const existingUser = await Usercollection.findOne({ username: data.username });

    if (existingUser) {
        res.send('User already exists. Please choose a different username.')
    }else {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashedPassword;

        await Usercollection.create(data);
        console.log("User registered", data.username);

        res.redirect("/dashboard");
    }
});


// Note: Fix password verification.

//handles the login page 
app.post("/login", async (req, res) => {
    try {
        const check = await Usercollection.findOne({ username: req.body.username });
        if (!check) {
            res.send("user name cannot found")
        }else {
            req.session.userId = check._id;
            res.redirect("/dashboard");
        }
    }catch {
        res.send("wrong Details")
    }
});


app.post("/transaction/add", async (req, res) => {
    const data = {
        type: req.body.type,
        amount: req.body.amount,
        note: req.body.note,
        userId: req.session.userId,
        categoryId: req.body.categoryId
    };

    await Transactioncollection.create(data);
    console.log("Transaction added to db", data.amount, data.type);

    res.redirect("/transactions");
});

// Category Add Post route/ This is where the data wil be sent to the database after user entered details
app.post("/category/add", async (req, res) => {
    const data = {
        name: req.body.name,
        type: req.body.type,
        userId: req.session.userId
    };
    await Categorycollection.create(data);
    console.log("Data addded to database with the followind", data.name, data.type);

    res.redirect("/category");
});

app.post("/category/edit/:id", async (req, res) => {
    const data = {
        name: req.body.name,
        type: req.body.type,
    };

    await Categorycollection.findByIdAndUpdate(req.params.id, data);

    res.redirect("/category");
});

app.post("/category/del/:id", async (req, res) => {
    try {
        await Categorycollection.findByIdAndDelete(req.params.id);
        
    }catch (err) {
        console.log(err);
    };

    res.redirect("/category");
});


const port = 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});

