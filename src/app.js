import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
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
import PostRouter from "./routes/Post.routes.js";
import LikeRouter from "./routes/Like.routes.js";
import GameRouter from "./routes/Game.routes.js";
import VideoRouter from "./routes/Video.routes.js";
import TournamentRouter from "./routes/Tournament.routes.js";
import { errorHandler } from "./middlewares/Error.middleware.js";
import DashboardRouter from "./routes/Dashboard.routes.js";
import CommentRouter from "./routes/Comment.routes.js";
import UserFollower from "./routes/Follower.routes.js";
// Routes declaration
app.use("/api/users", UserRouter);
app.use("/api/post", PostRouter);
app.use("/api/like", LikeRouter);
app.use("/api/game", GameRouter);
app.use("/api/videos", VideoRouter);
app.use("/api/tournament", TournamentRouter);
app.use(errorHandler);
app.use("/api/dashboard", DashboardRouter);
app.use("/api/comment", CommentRouter);
app.use("/api/follower", UserFollower);

export { app };
