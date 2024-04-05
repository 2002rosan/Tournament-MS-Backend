import { Router } from "express";
import {
  addComment,
  addPostComment,
  getPostComment,
  getVideoComments,
} from "../controllers/Comment.controller.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";

const router = Router();

router.route("/video/:videoId").post(verifyJWT, addComment);
router.route("/video/:videoId").get(getVideoComments);
router.route("/comment-post").post(verifyJWT, addPostComment);
router.route("/post/:postId").get(getPostComment);

export default router;
