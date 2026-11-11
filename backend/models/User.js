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


const collection = new mongoose.model("users", Userschema);

module.exports = collection;