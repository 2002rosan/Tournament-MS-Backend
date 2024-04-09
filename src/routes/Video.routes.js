import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import {
  deleteVideo,
  getAllVideo,
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
router.route("/:videoId").delete(verifyJWT, deleteVideo);
router.route("/:videoId").get(getVideoById);
router
  .route("/:videoId")
  .patch(verifyJWT, upload.single("thumbnail"), updateVideo);
router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);
router.route("/getUsersVideo/:userId").get(getUsersVideo);

export default router;
