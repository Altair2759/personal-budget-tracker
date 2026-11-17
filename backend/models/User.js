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


const Usercollection = new mongoose.model("users", Userschema);
const Categorycollection = new mongoose.model("category", Categoryschema)

module.exports = { Usercollection, Categorycollection};
