const mongoose = require('mongoose');


const categorySchema = new mongoose.Schema({
    category: { type: String },
    image: { type: String },
    public_id: { type: String },
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
