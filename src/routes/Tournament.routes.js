import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import { upload } from "../middlewares/Multer.middleware.js";
import {
  createTournament,
  deleteTournament,
  getAllTournment,
  joinTournament,
  tournamentResult,
  updateTournament,
} from "../controllers/Tournament.controller.js";

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

router.route("/").get(getAllTournment);

router.route("/join-tournament/:tournamentId").post(verifyJWT, joinTournament);

router
  .route("/update-tournament/:tournamentId")
  .patch(verifyJWT, upload.single("banner"), updateTournament);

router
  .route("/delete-tournament/:tournamentId")
  .delete(verifyJWT, deleteTournament);

router
  .route("/tournament-result/:tournamentId")
  .post(verifyJWT, tournamentResult);

export default router;
