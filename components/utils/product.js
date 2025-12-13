const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String },
    image: { type: String },
    price: { type: Number },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    detail: { type: String },
    public_id: { type: String },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
