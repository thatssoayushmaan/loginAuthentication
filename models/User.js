const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please enter your username']
    },
    email: {
        type: String,
        required: [true, "Please enter an email"],
        unique: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please provide a valid email"
        ]
    },
    password: {
        type: String,
        minlength: 6,
        required: [true, "Please enter a password"],
        select: false
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
})

//Mongoose middleware
//To run the schema before it
userSchema.pre("save", async function(next){
    //doesn't hash, if it already exists
    if(!this.isModified("password")){
        next();
    }
    //hashes the password
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.matchPasswords = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.getSignedToken = function(){
    return jwt.sign({id :this._id}, process.env.TOKEN, {expiresIn : '10min'})
}

userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
  
    // Hash token (private key) and save to database
    this.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
  
    // Set token expire date
    this.resetPasswordExpire = Date.now() + 10 * (60 * 1000); // Ten Minutes
  
    return resetToken;
  };

const User = mongoose.model('User', userSchema)

module.exports = User