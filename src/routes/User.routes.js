import { Router } from "express";
import { upload } from "../middlewares/Multer.middleware.js";
import { checkAdmin, verifyJWT } from "../middlewares/Auth.middleware.js";
import {
  loginUser,
  logoutUser,
  registerUser,
  changePassword,
  getCurrentUser,
  updateUserAvatar,
  refreshAccessToken,
  updateAccountDetails,
  updateUserCoverImage,
  getUserChannelProfile,
  checkRole,
  changeRole,
} from "../controllers/User.controller.js";
import { apiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import { EmailVerification } from "../models/emailVerification.model.js";
import { User } from "../models/user.model.js";

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

// To keep user loggedin
router.get("/verify-user", verifyJWT, (req, res) => {
  return res.status(200).json({ data: req.user });
});

router.get("/verify-email", async (req, res) => {
  const { code } = req.query;
  if (!code) throw new apiError(400, "Verification code is required");

  try {
    const decodedToken = jwt.verify(
      code,
      process.env.EMAIL_VERIFICATION_SECRET_CODE
    );

    const delete1 = await EmailVerification.findOneAndDelete({
      $and: [{ code: decodedToken.code }, { userId: decodedToken.userId }],
    });
    if (delete1 == null) {
      return res.send(
        `<div style=height:100dvh;display:grid;place-content:center; > <p>Token not found</p> </div>`
      );
    }
    await User.findByIdAndUpdate(decodedToken.userId, { emailVerified: true });

    const baseURL = process.env.BASE_URL;

    res.send(
      `<div style=height:100dvh;display:grid;place-content:center; > <p style=color:green;>Email Verified</p> <a href=${baseURL}/login>Go To TMS</a> </div>`
    );
  } catch (error) {
    res.send(
      `<div style=height:100dvh;display:grid;place-content:center; > <p style=color:red; >Invalid Link</p> </div>`
    );
  }
});

// Login route
router.route("/login").post(loginUser);

// SECURED ROUTES
// Logout route
router.route("/logout").post(verifyJWT, logoutUser);
// Refresh access token routes
router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changePassword);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/update-account").patch(verifyJWT, updateAccountDetails);

router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/c/:userName").get(verifyJWT, getUserChannelProfile);

router.route("/update-role/:id").patch(verifyJWT, checkAdmin, changeRole);

export default router;
