const mongoose = require('mongoose');
const connect = mongoose.connect("mongodb://localhost:27017/BudgetTracker");

connect.then(() => {
    console.log("Database Connected Successfully");
})
.catch((() => {
    console.log("Database cannot be connected");
}))

const Userschema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

const Categoryschema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    }
});

const Transactionschema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    note: {
        type: String,
        required: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
        required: true
    }
});

const Budgetschema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
        required: true
    }

});



const Usercollection = new mongoose.model("users", Userschema);
const Categorycollection = new mongoose.model("category", Categoryschema);
const Transactioncollection = new mongoose.model("transaction", Transactionschema);
const Budgetcollection = new mongoose.model("budget", Budgetschema);

module.exports = { Usercollection, Categorycollection, Transactioncollection, Budgetcollection };
