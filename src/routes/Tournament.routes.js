import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import { upload } from "../middlewares/Multer.middleware.js";
import { createTournament } from "../controllers/Tournament.controller.js";

const router = Router();

router.route("/create-tournament").post(
  verifyJWT,
  upload.fields([
    {
      name: "banner",
      maxCount: 1,
    },
  ]),
  createTournament
);

export default router;
