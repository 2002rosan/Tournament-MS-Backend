import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import {
  toggleCommentLike,
  togglePostLike,
  toggleVideoLike,
} from "../controllers/Like.controller.js";

const router = Router();

router.route("/videoLike/:videoId").post(verifyJWT, toggleVideoLike);
router.route("/commentLike/:commentId").post(verifyJWT, toggleCommentLike);
router.route("/postLike/:postId").post(verifyJWT, togglePostLike);

export default router;
