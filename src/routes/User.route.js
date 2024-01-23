import { Router } from "express";
import { upload } from "../middlewares/Multer.middleware.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/User.controller.js";

const router = Router();

// Register route
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

// Login route
router.route("/login").post(loginUser);

// SECURED ROUTES
// Logout route
router.route("/logout").post(verifyJWT, logoutUser);
// Refresh access token routes
router.route("/refresh-token").post(refreshAccessToken);

export default router;
