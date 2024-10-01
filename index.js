import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { roomHandler } from "./room/index.js";
import dotenv from "dotenv";
dotenv.config();

const port = process.env.PORT || 5000;
const app = express();

app.get("/health", (_, res) => {
    res.send("Server is running");
});

app.use(cors);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log("a user connected");
    roomHandler(socket);
   
    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});

server.listen(port, () => {
    console.log(`listening on *:${port}`);
});