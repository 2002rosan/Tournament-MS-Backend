import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import {
  getChannelVideo,
  getProfileStats,
} from "../controllers/Dashboard.controller.js";

const router = Router();

router.route("/getVideo").get(verifyJWT, getChannelVideo);
router.route("/getChannelStats").get(verifyJWT, getProfileStats);

export default router;
