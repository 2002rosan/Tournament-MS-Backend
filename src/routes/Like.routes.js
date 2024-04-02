import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import {
  getPostLikes,
  toggleCommentLike,
  togglePostLike,
  toggleVideoLike,
} from "../controllers/Like.controller.js";

const router = Router();

router.route("/videoLike/:videoId").post(verifyJWT, toggleVideoLike);
router.route("/commentLike/:commentId").post(verifyJWT, toggleCommentLike);
router.route("/postLike").post(verifyJWT, togglePostLike);
router.route("/postLike-byId").post(getPostLikes);

export default router;
