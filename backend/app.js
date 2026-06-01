import express from 'express';
import { PORT } from "./config/env.js";
import cors from "cors";
import connectToDatabase from "./database/mongodb.js";
import agentRouter from "./routes.js";

const app  = express();

app.use(cors({
    origin : [
        "http://localhost:5173",
    ],
    credentials : true
}));

app.use(express.json());
app.use(express.urlencoded({extended : true}));

app.use('/api/agent', agentRouter);

const startServer = async () => {
    try {
        await connectToDatabase();
        app.listen(PORT, () => {
            console.log(`App running on : http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();