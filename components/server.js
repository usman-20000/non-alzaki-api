import "./conn.js";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import Register from "../components/register.js";
import Add from "./add.js";
import Bill from "./bill.js";
import Category from "./category.js";

import cloudinary from "./utils/cloudinary.js";
import Product from "./utils/product.js";

const app = express();


const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use(cors());


app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

app.post("/upload-category", async (req, res) => {
  try {
    const { category } = req.body;
    const file = req.body.image; // Base64 or URL

    if (!category || !file) {
      return res.status(400).json({ error: "Category and image are required" });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload_large(file, {
      folder: "mern_uploads",
    });

    console.log("image_url:", uploadResult.secure_url);

    // Save category in MongoDB
    const newCategory = new Category({
      category,
      image: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    });

    await newCategory.save();

    // Send response once
    res.status(201).json({
      success: true,
      category: newCategory,
      image_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/delete-category/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find the category in MongoDB
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Delete image from Cloudinary
    if (category.public_id) {
      await cloudinary.uploader.destroy(category.public_id);
      console.log("Deleted image from Cloudinary:", category.public_id);
    }

    // Delete category from MongoDB
    await Category.findByIdAndDelete(id);

    res.json({ success: true, message: "Category and image deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


app.post("/upload-product", async (req, res) => {
  try {
    const { name, category, detail, price } = req.body;
    const file = req.body.image;

    const parsedPrice = Number(price);

    if (!name || !category || !detail || !file || parsedPrice == null) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: "Invalid price" });
    }

    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const uploadResult = await cloudinary.uploader.upload(file, {
      folder: "mern_uploads",
    });

    const newProduct = new Product({
      name,
      category,
      detail,
      price: parsedPrice,
      image: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    });

    await newProduct.save();

    res.status(201).json({
      success: true,
      product: newProduct,
      image_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});


// app.post('/category', async (req, res) => {
//   try {
//     const { category, image } = req.body;
//     const newCategory = new Category({ category, image });
//     await newCategory.save();
//     res.status(201).json(newCategory);
//   } catch (error) {
//     console.error('Error creating Category', error);
//     res.status(500).send('Internal Server Error');
//   }
// });

app.get('/category', async (req, res) => {
  try {
    const category = await Category.find();
    res.json(category);
  } catch (error) {
    console.error('Error fetching category', error);
    res.status(500).send('Internal Server Error');
  }
});



app.get('/products', async (req, res) => {
  try {
    // 1. Load all categories only once
    const categories = await Category.find();

    // 2. Create a lookup map: { categoryId: categoryName }
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat._id] = cat.category;
    });

    console.log('cat:', categoryMap);

    // 3. Map products using categoryMap
    const products = await Product.find();

    res.json(
      products.map(p => ({
        name: p.name,
        image: p.image,
        category: categoryMap[p.category],
        detail: p.detail
      }))
    );

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// app.patch("/categories/:id/subcategories", async (req, res) => {
//   const { id } = req.params;
//   const { subcategoryName } = req.body;

//   try {
//     const category = await Category.findById(id);
//     if (!category) {
//       return res.status(404).json({ message: "Category not found" });
//     }

//     category.subcategories.push({ name: subcategoryName });

//     const updatedCategory = await category.save();
//     res.status(200).json({
//       message: "Subcategory added successfully",
//       updatedCategory,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Error adding subcategory", error });
//   }
// });


app.post('/bill', async (req, res) => {
  try {
    const { email, name, address, house, city, postalCode, phone, status, cart } = req.body;
    const newBill = new Bill({ email, name, address, house, city, postalCode, phone, status, cart });
    await newBill.save();
    res.status(201).json(newBill);
  } catch (error) {
    console.error('Error creating register', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/bill', async (req, res) => {
  try {
    const bill = await Bill.find();
    res.json(bill);
  } catch (error) {
    console.error('Error fetching register', error);
    res.status(500).send('Internal Server Error');
  }
});

app.put('/bill/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedBill = await Bill.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    if (!updatedBill) {
      return res.status(404).send('Add not found');
    }
    res.status(200).json(updatedBill);
  } catch (error) {
    console.error('Error updating add', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/add', async (req, res) => {
  try {
    const { image, heading, detail, price, category } = req.body;
    const newAdd = new Add({ image, heading, detail, price, category });
    await newAdd.save();
    res.status(201).json(newAdd);
  } catch (error) {
    console.error('Error creating register', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/add/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const add = await Add.findById(id);
    if (!add) {
      return res.status(404).json({ error: 'Add not found' });
    }
    res.json(add);
  } catch (error) {
    console.error('Error fetching add:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/add', async (req, res) => {
  try {
    const add = await Add.find();
    res.json(add);
  } catch (error) {
    console.error('Error fetching register', error);
    res.status(500).send('Internal Server Error');
  }
});

app.put('/add/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { image, heading, detail, price } = req.body;
    const updatedAdd = await Add.findByIdAndUpdate(
      id,
      { image, heading, detail, price },
      { new: true, runValidators: true }
    );
    if (!updatedAdd) {
      return res.status(404).send('Add not found');
    }
    res.status(200).json(updatedAdd);
  } catch (error) {
    console.error('Error updating add', error);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/add/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAdd = await Add.findByIdAndDelete(id);
    if (!deletedAdd) {
      return res.status(404).send('Add not found');
    }
    res.status(200).send('Add deleted successfully');
  } catch (error) {
    console.error('Error deleting add', error);
    res.status(500).send('Internal Server Error');
  }
});



app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const newRegister = new Register({ name, email, password });
    await newRegister.save();
    res.status(201).json(newRegister);
  } catch (error) {
    console.error('Error creating register', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/register', async (req, res) => {
  try {
    const register = await Register.find();
    res.json(register);
  } catch (error) {
    console.error('Error fetching register', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
