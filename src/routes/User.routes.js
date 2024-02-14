import { Router } from "express";
import { upload } from "../middlewares/Multer.middleware.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
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
} from "../controllers/User.controller.js";
import { apiResponse } from "../utils/apiResponse.js";

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

// router.route("/history").get(verifyJWT, watchHistory);

router.get("/verifyUser", verifyJWT, (req, res) => {
  const data = { message: "Welcome" };
  return res
    .status(200)
    .json(new apiResponse(200, req.user.fullName, "Success"));
});

export default router;
