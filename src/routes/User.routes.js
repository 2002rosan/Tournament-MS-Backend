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
  changeRole,
  resetPassword,
  verifyEmail,
} from "../controllers/User.controller.js";
import { apiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ResetPassword } from "../models/resetPassword.model.js";

const router = Router();

// Register route
router.route("/register").post(registerUser);

// To keep user loggedin
router.get("/verify-user", verifyJWT, (req, res) => {
  return res.status(200).json({ data: req.user });
});

router.get("/verify-admin", verifyJWT, checkAdmin, (req, res) => {
  return res.status(200).json({ data: req.user });
});

router.route("/reset-password").post(resetPassword);

router.post("/verify-password", async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) throw new apiError(400, "Verification code is required");

    const { newPassword } = req.body;
    if (!newPassword) throw new apiError(400, "New password is required");

    const decodedToken = jwt.verify(code, process.env.RESET_PASSWORD_SECRET);

    const delete1 = await ResetPassword.findOneAndDelete({
      $and: [{ code: decodedToken.code }, { userId: decodedToken.userId }],
    });

    if (delete1 == null) {
      return res
        .status(403)
        .json({ message: "Try sending a new verification mail" });
    }
    const user = await User.findById(decodedToken.userId);
    user.password = newPassword;
    await user.save({ validateBeforeSave: true });
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
});

router.route("/verify-email").get(verifyEmail);

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
