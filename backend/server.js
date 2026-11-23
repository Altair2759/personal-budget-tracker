const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const {Usercollection, Categorycollection, Transactioncollection, Budgetcollection} = require("./models/User");

const app = express();

function formatCurrency(amount) {
    return "R " + Number(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

app.locals.formatCurrency = formatCurrency;

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
app.get("/dashboard", async (req, res) => {
    const userId = req.session.userId;

    const transactions = await Transactioncollection.find({userId}).populate("categoryId");


    const budgets = await Budgetcollection.find({userId, month: new Date().getMonth() + 1, year: new Date().getFullYear()}).populate("categoryId");

    //Total income and expenses
    const income = transactions.filter(t => t.type === "Income").reduce((total, t) => total + Number(t.amount), 0);

    const expenses = transactions.filter(t => t.type === "Expense").reduce((total, t) => total + Number(t.amount), 0);

    const balance = income - expenses;

    //current month transactions
    const now = new Date();

    const currentMonthTransactions = transactions.filter(t => {
        return t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear();

    });

    const monthlyIncome = currentMonthTransactions.filter(t => t.type === "Income").reduce((total, t) => total + Number(t.amount), 0);

    const monthlyExpense = currentMonthTransactions.filter(t => t.type === "Expense").reduce((total, t) => total + Number(t.amount), 0);


    //Calculate current months budget spending
    const budgetWithSpent = budgets.map(budget => {
        const spent = currentMonthTransactions.filter(t => t.type === "Expense" 
            && t.categoryId 
            && t.categoryId._id.toString() === budget.categoryId._id.toString()
        ).reduce((total, t) => total + Number(t.amount), 0);

        return {
            categoryId: budget.categoryId,
            amount: Number(budget.amount),
            spent: spent
        };

    });

    const budgetWarnings = budgetWithSpent.filter(b => (b.spent / b.amount) * 100 >= 80);

    const totalBudget = budgetWithSpent.reduce((total, b) => total + b.amount, 0);

    const totalSpent = budgetWithSpent.reduce((total, b) => total + b.spent, 0);

    const remainingBudget = totalBudget - totalSpent;

    //last six months
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

        const month = date.getMonth();
        const year = date.getFullYear();

        const monthTransactions = transactions.filter(t => {
            return t.date && t.date.getMonth() === month && t.date.getFullYear() === year;
        });

        const monthIncome = monthTransactions.filter(t => t.type === "Income").reduce((total, t) => total + Number(t.amount), 0);

        const monthExpense = monthTransactions.filter(t => t.type === "Expense").reduce((total, t) => total + Number(t.amount), 0);

        monthlyData.push({
            label: date.toLocaleString("en-ZA", {month: "short"}),
            income: monthIncome,
            expense: monthExpense
        });
    }

    //Expense distrubution by category for current month
    const categoryData = {};

    currentMonthTransactions.filter(t => t.type === "Expense" && t.categoryId).forEach(t => {
        const categoryName = t.categoryId.name;

        if (!categoryData[categoryName]) {
            categoryData[categoryName] = 0;
        }
        categoryData[categoryName] += Number(t.amount);
    });

    const expenseLabels = Object.keys(categoryData);
    const expenseValues = Object.values(categoryData);


    res.render("dashboard", { currentPage: "dashboard", balance, monthlyIncome, monthlyExpense, remainingBudget, monthlyData, expenseLabels, expenseValues, budgetWarnings  });
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
app.get("/budget", async (req, res) => {
    const budgets = await Budgetcollection.find({userId: req.session.userId}).populate("categoryId");
    const transactions = await Transactioncollection.find({userId: req.session.userId}); 


    const budgetWithSpent = budgets.map(budget => {
        const filterTransactions = transactions.filter(transaction => {
            return transaction.categoryId.toString() === budget.categoryId._id.toString()
            && transaction.date.getMonth() + 1 === budget.month
            && transaction.date.getFullYear() === budget.year;
        });

        const totalSpent = filterTransactions.reduce((total, transaction) => {
            return total + Number(transaction.amount);
        }, 0); 

        return {
            ...budget.toObject(),
            totalSpent: totalSpent
        };
    });


    const totalBudget = budgetWithSpent.reduce((total, budget) => {
        return total + budget.amount;
    }, 0);

    const totalBudgetSpent = budgetWithSpent.reduce((total, budget) => {
        return total + budget.totalSpent;
    }, 0);

    const remaining = totalBudget - totalBudgetSpent;


    res.render("budget", { currentPage: "budget", budgets: budgetWithSpent, totalBudget, totalBudgetSpent, remaining  });
});

app.get("/budget/add", async (req, res) => {
    const categories = await Categorycollection.find({userId: req.session.userId});
    // const transactions = await Transactioncollection.find({userId: req.session.userId});
    res.render("budget-form", { budget: null, categories: categories });
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
        
        const newUser = await Usercollection.create(data);

        req.session.userId = newUser._id;

        console.log("User registered", newUser.username);

        res.redirect("/dashboard");
    }
});


// Note: Fix password verification.

//handles the login page 
app.post("/login", async (req, res) => {
    try {
        const check = await Usercollection.findOne({ username: req.body.username });
        const passwordMatch = await bcrypt.compare(req.body.password, check.password);
        if (!check) {
            res.send("user name cannot found")
        }
        if (!passwordMatch) {
            return res.send("Incorrect password");
        }

        req.session.userId = check._id;
        res.redirect("/dashboard");
        
    }catch {
        res.send("wrong Details")
    }
});


app.post("/transaction/add", async (req, res) => {
    const data = {
        date: req.body.date,
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


app.post("/budget/add", async (req, res) => {
    const data = {
        amount: req.body.amount,
        userId: req.session.userId,
        categoryId: req.body.categoryId,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    };

    await Budgetcollection.create(data);
    console.log("Budget added to db", data.amount);

    res.redirect("/budget");
});



const port = 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});

