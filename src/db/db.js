import mongoose from "mongoose";
import config from "../config/config.js";


async function connectDb() {
    try {
        await mongoose.connect(config.MONGO_URI)
        console.log("Mongo db is connect")
    } catch (error) {
        console.error("Error connecting to MongoDb",error); 
        throw error;
    }
}


export default connectDb;
