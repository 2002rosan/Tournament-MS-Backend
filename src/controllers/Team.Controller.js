import { Team } from "../models/team.model.js";
import { apiResponse } from "../utils/apiResponse.js";

const createTeam = async (req, res, next) => {
  try {
    const { teamName, memberLimit } = req.body;
    const owner = req.user?.id;

    const team = await Team.create({
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

const joinTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const userId = req.user?.id;

    const team = await Team.findById(teamId);
    if (!team) throw new apiError(404, "Team not found");

    if (team.members.length >= team.memberLimit) {
      throw new apiError(400, "Team has reached its member limit");
    }

    team.members.push(userId);
    await team.save();

    return res.status(200).json(new apiResponse(200, team, "Team joined"));
  } catch (error) {
    next(error);
  }
};

export { createTeam, joinTeam };
