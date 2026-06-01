import {DB_URI, NODE_ENV} from "../config/env.js";
import mongoose from "mongoose";

if(!DB_URI){
    throw new Error("Please define a mongodb URI Environment variable inside .env.<development/production>.local");
}


const connectToDatabase = async() => {

    try{

        console.log("Trying to connect to databse");
        await mongoose.connect(DB_URI);
        console.log(`Connected to database in ${NODE_ENV} mode`);

    }catch(err){
        console.error("Error connecting to database : ", err);
        process.exit(1);
    }
}


export default connectToDatabase;


