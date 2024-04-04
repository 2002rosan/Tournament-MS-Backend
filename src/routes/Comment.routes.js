import { Router } from "express";
import {
  addComment,
  addPostComment,
  getVideoComments,
} from "../controllers/Comment.controller.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";

const router = Router();

router.route("/:videoId").post(verifyJWT, addComment);
router.route("/:videoId").get(getVideoComments);
router.route("/").post(verifyJWT, addPostComment);

export default router;
