import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import {
  createPost,
  deletePost,
  getUserPosts,
  updatePost,
} from "../controllers/Post.controller.js";

const router = Router();

router.route("/create-post").post(verifyJWT, createPost);
router.route("/getPosts").get(verifyJWT, getUserPosts);
router.route("/update-post/:postId").patch(verifyJWT, updatePost);
router.route("/delete-post/:postId").delete(verifyJWT, deletePost);

export default router;
