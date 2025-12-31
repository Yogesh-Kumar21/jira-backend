import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors"
import session from "express-session"
import bodyParser from "body-parser"
import http from "http"
import authRouter from "./routes/auth-routes";
import userRouter from "./routes/user-routes";
import "./models/Ticket";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors({
    credentials: true,
    origin: true
}))
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser())
app.use(express.json())
app.use(session({ secret: "keyboard cat" }))

app.use('/auth', authRouter)
app.use('/api', userRouter)

app.use('/controller/uploads', express.static('uploads'));
app.use('/uploads', express.static('uploads'))

app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
});

const httpServer = http.createServer(app)

console.log("[LOG] Connecting to ", process.env.MONGODB_URL)

if (process.env.MONGODB_URL) {
    mongoose.connect(process.env.MONGODB_URL)
        .then(() => {
            httpServer.listen(port, () => {
                console.log(`HTTP server listening on port ${port}`);
            });

        })
        .catch((err: any) => console.error(err))
}
else {
    console.log("[!] Please provide the DB connection string")
}