const User = require('../models/User')
const errorResponse = require('../utils/errorResponse')
const crypto = require('crypto')
const sendEmail = require('../utils/sendEmail')

const register = async (req, res, next) => {
    const {username, email, password} = req.body
    try {
        const user = await User.create({
            username,email,password
        })
        sendToken(user, 201, res)
    } catch (error) {
        // res.status(500).json({success: false,error : error.message})
        next(error)
    }
}

const login = async (req, res, next) => {
    const {email,password} = req.body

    if(!email || !password){
        // res.status(400).json({success : false,error : "Please enter email and password"})
        return next(new errorResponse("Please enter your email and password", 400))
    }

    try {
        const user = await User.findOne({email}).select("+password")
        if(!user){
            return next(new errorResponse("Invalid Credentials", 401))
        }
        const isMatch = await user.matchPasswords(password)

        if(!isMatch){
            return next(new errorResponse("Invalid Password", 401))
        }

        sendToken(user, 200, res)
    } catch (error) {
        res.status(500).json({
            status: false,
            error: error.message
        })
    }
}

const forgotPassword = async (req, res, next) => {
    const {email} = req.body

    try {
        const user = await User.findOne({email})

        if(!user){
            return next(new errorResponse("Email could not be sent", 404))
        }

        const resetToken = user.getResetPasswordToken()

        await user.save()

        const resetUrl = `http://localhost:3001/password-reset/${resetToken}`

        const message = `
      <h1>You have requested a password reset</h1>
      <p>Please make a put request to the following link:</p>
      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
    `;

        try {
            await sendEmail({
                to:user.email,
                subject: 'Reset Password Request',
                text: message
            })

            res.status(200).json({
                status: true,
                data: "Email Sent"
            })
        } catch (error) {
            user.resetPasswordToken = undefined
            user.resetPasswordExpire = undefined

            await user.save()

            return next(new errorResponse("Email could not be sent", 500))
        }

    } catch (error) {
        next(error)
    }
}

const resetPassword = async (req, res, next) => {
    // Compare token in URL params to hashed token
  const resetPasswordToken = crypto
  .createHash("sha256")
  .update(req.params.resetToken)
  .digest("hex");

try {
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse("Invalid Token", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(201).json({
    success: true,
    data: "Password Updated Success",
    token: user.getSignedJwtToken(),
  });
} catch (err) {
  next(err);
}
}

const sendToken = (user, statusCode, res) => {
    const token = user.getSignedToken()
    res.status(statusCode).json({status: true, token})
}

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword
}