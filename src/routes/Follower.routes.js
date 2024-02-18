import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import {
  getUserFollowers,
  getUserFollowing,
  toggleFollow,
} from "../controllers/Follower.controller.js";

const router = Router();

router.route("/:channelId").post(verifyJWT, toggleFollow);
router.route("/getFollower/:channelId").get(getUserFollowers);
router.route("/getFollowing/:channelId").get(getUserFollowing);

export default router;
