import { Router } from "express";
import {
  addComment,
  getVideoComments,
} from "../controllers/Comment.controller.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";

const router = Router();

router.route("/:videoId").post(verifyJWT, addComment);
router.route("/:videoId").get(getVideoComments);

export default router;
