import { Router } from "express";
import { upload } from "../middlewares/Multer.middleware.js";
import { checkAdmin, verifyJWT } from "../middlewares/Auth.middleware.js";
import {
  createGame,
  deleteGames,
  getGames,
} from "../controllers/Game.controller.js";

const router = Router();

router.route("/").get(getGames);

router.route("/create-game").post(
  verifyJWT,
  checkAdmin,
  upload.fields([
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  createGame
);

router.route("/delete-game/:id").delete(verifyJWT, checkAdmin, deleteGames);

export default router;
