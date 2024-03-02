import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import {
  createPost,
  deletePost,
  getAllPosts,
  getUserPosts,
  updatePost,
} from "../controllers/Post.controller.js";

const router = Router();

router.route("/").get(getAllPosts);
router.route("/create-post").post(verifyJWT, createPost);
router.route("/getPosts/:userId").get(verifyJWT, getUserPosts);
router.route("/update-post/:postId").patch(verifyJWT, updatePost);
router.route("/delete-post/:postId").delete(verifyJWT, deletePost);

export default router;
