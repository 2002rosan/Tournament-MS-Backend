import { Team } from "../models/team.model.js";
import { apiResponse } from "../utils/apiResponse.js";

const createTeam = async (req, res, next) => {
  try {
    const { teamName, memberLimit } = req.body;
    const owner = req.user?.id;

    const team = Team.create({
      teamName,
      owner,
      memberLimit,
      members: [owner],
    });

    return res.status(200).json(new apiResponse(200, team, "Team created"));
  } catch (error) {
    next(error);
  }
};

export { createTeam };
