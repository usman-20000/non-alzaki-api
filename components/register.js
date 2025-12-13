const mongoose = require('mongoose');

const registerSchema = new mongoose.Schema({
  name:String,
  email: String,
  password:String,
});

const Register = mongoose.model('Register', registerSchema);

module.exports = Register;
