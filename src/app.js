import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(
  express.urlencoded({
    limit: "16kb",
    extended: true,
  })
);

app.use(express.static("public"));

app.use(cookieParser());

// Routes imports
import UserRouter from "./routes/User.routes.js";
import VideoRouter from "./routes/Video.routes.js";
import PostRouter from "./routes/Post.routes.js";
import LikeRouter from "./routes/Like.routes.js";
import TournamentRouter from "./routes/Tournament.routes.js";
// Routes declaration
app.use("/api/users", UserRouter);
app.use("/api/videos", VideoRouter);
app.use("/api/post", PostRouter);
app.use("/api/like", LikeRouter);
app.use("/api/tournament", TournamentRouter);

export { app };
