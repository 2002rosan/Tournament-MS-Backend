import { Router } from "express";
import {
  getLoggedInUserId,
  verifyJWT,
} from "../middlewares/Auth.middleware.js";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPostByID,
  getUserPosts,
  updatePost,
} from "../controllers/Post.controller.js";

const router = Router();

router.route("/").get(getLoggedInUserId, getAllPosts);
router.route("/create-post").post(verifyJWT, createPost);
router.route("/getPosts/:userId").get(verifyJWT, getUserPosts);
router.route("/update-post/:postId").patch(verifyJWT, updatePost);
router.route("/delete-post/:postId").delete(verifyJWT, deletePost);
router.route("/:postId").get(getPostByID);

export default router;
