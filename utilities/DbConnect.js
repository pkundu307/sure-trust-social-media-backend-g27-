import mongoose from "mongoose";

export const connectToDatabase = async () => {
    try{
      mongoose.connect(process.env.mongoUrl).then(() => {
          console.log("Connected to MongoDB");
      })
    }catch(err){
        console.error("Error connecting to the database:", err);
        throw err;
    }
}