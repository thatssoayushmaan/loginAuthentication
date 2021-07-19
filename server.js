require('dotenv').config()

const authRoute = require('./routes/auth.route')
const privateRoute = require('./routes/private.route')

const express = require('express')
const app = express()

const connectDB = require('./config/db')
connectDB()

const errorHandler = require('./middleware/error')

//Middleware
app.use(express.json())
app.use('/api/auth', authRoute)
app.use('/api/private', privateRoute)


//Error Handler should be last piece of middleware
app.use(errorHandler)

const PORT = process.env.PORT || 5000
const server = app.listen(PORT, () => {
    console.log(`Server up and running at ${PORT}`)
})

process.on("unhandledRejection", (err, promise) => {
    console.log(`Logged Error:  ${err}`)
    server.close(() => process.exit(1))
})