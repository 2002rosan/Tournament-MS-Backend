import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import { upload } from "../middlewares/Multer.middleware.js";
import {
  createTournament,
  deleteTournament,
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

router
  .route("/update-tournament/:tournamentId")
  .patch(verifyJWT, upload.single("banner"), updateTournament);

router
  .route("/delete-tournament/:tournamentId")
  .delete(verifyJWT, deleteTournament);

export default router;
