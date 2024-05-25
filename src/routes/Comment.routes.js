import { Router } from "express";
import {
  addComment,
  addPostComment,
  deleteComment,
  getPostComment,
  getVideoComments,
} from "../controllers/Comment.controller.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";

const router = Router();

router.route("/video").post(verifyJWT, addComment);
router.route("/video-comments/:videoId").get(getVideoComments);
router.route("/comment-post").post(verifyJWT, addPostComment);
router.route("/post/:postId").get(getPostComment);
router.route("/delete-comment/:commentId").delete(verifyJWT, deleteComment);

export default router;
