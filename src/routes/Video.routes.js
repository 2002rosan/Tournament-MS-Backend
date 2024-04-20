import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import {
  deleteVideo,
  getAllVideo,
  getGamesVideo,
  getMyVideos,
  getUsersVideo,
  getVideoById,
  publishVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/Video.controller.js";
import { upload } from "../middlewares/Multer.middleware.js";

const router = Router();

router.route("/").get(getAllVideo);
router.route("/upload-video").post(
  verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideo
);
router.route("/delete-video/:videoId").delete(verifyJWT, deleteVideo);
router.route("/:videoId").get(getVideoById);
router.route("/update-video").patch(verifyJWT, updateVideo);
router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);
router.route("/getUsersVideo/:userId").get(getUsersVideo);
router.route("/manageVideos/:userId").get(verifyJWT, getMyVideos);
router.route("/getGamesVideo/:gameId").get(getGamesVideo);

export default router;
