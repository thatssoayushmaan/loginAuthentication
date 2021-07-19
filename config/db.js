const mongoose = require('mongoose')

const connectDB = async () => {
    await mongoose.connect(process.env.MONGODB_URL, {
        useFindAndModify: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useNewUrlParser: true
    })

    console.log("MongoDB Connected")
}

module.exports = connectDB