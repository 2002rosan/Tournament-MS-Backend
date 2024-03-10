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
import { ResetPassword } from "../models/resetPassword.model.js";

const router = Router();

// Register route
router.route("/register").post(registerUser);

// To keep user loggedin
router.get("/verify-user", verifyJWT, (req, res) => {
  return res.status(200).json({ data: req.user });
});

router.get("/reset-password", async (req, res, next) => {
  const { email } = req.body;
  if (!email) return new apiError(404, "Please provide an email");

  try {
    const foundUser = await User.findOne({ email });
    if (!foundUser) return apiError(404, "This email is not registered!");

    const token = await ResetPassword.create({ email, userId: foundUser._id });
    console.log(token);
    // Send reset password link to the user
    return res
      .status(200)
      .json({ token: token, message: "Link has been sent to your email!" });
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const { code } = req.query;
    console.log({ code: code });
    if (!code) throw new apiError(400, "Verification code is required");

    const { newPassword } = req.body;
    console.log({ password: newPassword });
    if (!newPassword) throw new apiError(400, "New password is required");

    const decodedToken = jwt.verify(code, process.env.RESET_PASSWORD_SECRET);
    console.log({ decodedToken: decodedToken });

    const delete1 = await ResetPassword.findOneAndDelete({
      $and: [{ code: decodedToken.code }, { userId: decodedToken.userId }],
    });
    console.log(delete1);

    if (delete1 == null) {
      return res
        .status(403)
        .json({ message: "Try sending a new verification mail" });
    }
    const user = await User.findById(decodedToken.userId);
    user.password = newPassword;
    await user.save({ validateBeforeSave: true });
    console.log({ find: user });
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/verify-email", async (req, res) => {
  const { code } = req.query;
  if (!code) return new apiError(400, "Verification code is required");

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
