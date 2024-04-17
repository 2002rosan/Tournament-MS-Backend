import { EmailVerification } from "../models/emailVerification.model.js";
import { ResetPassword } from "../models/resetPassword.model.js";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  removeFileFromCloudinary,
  uploadOnCloudinary,
} from "../utils/Cloudinary.js";
import jwt from "jsonwebtoken";

// generate access and refresh tokens
const generateAccessAndRefreshToken = async (userDetail) => {
  try {
    const user = await User.findById(userDetail.id);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      500,
      "something went wrong while generateing refresh and access token",
      error
    );
  }
};

// Register User
const registerUser = asyncHandler(async (req, res, next) => {
  const { fullName, email, userName, password } = req.body;
  try {
    if (
      [fullName, email, userName, password].some(
        (field) => field?.trim() === ""
      )
    ) {
      throw new apiError(400, "Please fill all the fields");
    }

    // Check if user already exists
    const existingUserName = await User.findOne({ userName });
    if (existingUserName) {
      throw new apiError(409, `1:${userName} is not available`);
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      throw new apiError(409, `2:The user already exists`);
    }
    // Create user object to create entry in DB
    const user = await User.create({
      fullName,
      email,
      password,
      userName: userName.toLowerCase(),
    });

    await EmailVerification.create({
      userId: user._id,
      email,
    });

    return res
      .status(201)
      .json(new apiResponse(200, {}, "User registered successfully"));
  } catch (error) {
    next(error);
  }
});

const resendVerification = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const userId = req.user?.id;
  try {
    if (!email) throw new apiError(400, "Please provide email");

    const Email = await EmailVerification.create({ userId, email });
    if (!Email) throw new apiError(404, "Email not found");

    return res
      .status(200)
      .json(new apiResponse(200, {}, `Verification link was sent to ${email}`));
  } catch (error) {
    next(error);
  }
});

const verifyEmail = async (req, res) => {
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
    await User.findByIdAndUpdate(
      decodedToken.userId,
      { emailVerified: true },
      { new: true }
    );

    const baseURL = process.env.BASE_URL;

    res.send(
      `<div style=height:100dvh;display:grid;place-content:center; > <p style=color:green;>Email Verified</p> <a href=${baseURL}/login>Go To TMS</a> </div>`
    );
  } catch (error) {
    res.send(
      `<div style=height:100dvh;display:grid;place-content:center; > <p style=color:red; >Invalid Link</p> </div>`
    );
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new apiError(404, "Please provide an email");
    }

    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      throw new apiError(404, "This email is not registered!");
    }

    await ResetPassword.create({ email, userId: foundUser._id });
    // Send reset password link to the user
    return res
      .status(200)
      .json({ message: "Link has been sent to your email!" });
  } catch (error) {
    next(error);
  }
};

// Login User
const loginUser = asyncHandler(async (req, res) => {
  // req data from body
  const { email, password, userName } = req.body;

  if (!(email || userName) && !password) {
    throw new apiError(400, "Please provide email or username");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  // check if user exists
  if (!user) {
    throw new apiError(404, "1:User doesnot exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(401, "2:Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken({
    id: user._id,
    userName: user.userName,
  });

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // sending cookies
  const accessTokenOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: process.env.ACCESS_TOKEN_EXPIRY,
  };
  const refreshTokenOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: process.env.REFERESH_TOKEN_EXPIRY,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenOptions)
    .cookie("refreshToken", refreshToken, refreshTokenOptions)
    .json({
      statusCode: 200,
      user: loggedInUser,
      accessToken,
      message: "User logged in successfully",
      success: true,
    });
});

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user.id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged out successfully!"));
});

// Refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, "Unauthorized request");
  }

  // This code didnt work
  // try {
  //   const decodedToken = jwt.verify(
  //     incomingRefreshToken,
  //     process.env.REFERESH_TOKEN_SECRET
  //   );

  //   const user = User.findById(decodedToken?._id);

  //   if (!user) {
  //     throw new apiError(401, "Invalid refresh token");
  //   }

  //   if (incomingRefreshToken !== user?.refreshToken) {
  //     throw new apiError(401, "Refresh token expired");
  //   }

  //   const options = {
  //     httpOnly: true,
  //     secure: true,
  //   };

  //   const { accessToken, newRefreshToken } =
  //     await generateAccessAndRefreshToken(user._id);

  //   return res
  //     .status(200)
  //     .cookie("accessToken", accessToken, options)
  //     .cookie("refreshToken", newRefreshToken, options)
  //     .json(
  //       new apiResponse(
  //         200,
  //         { accessToken, refreshToken: newRefreshToken },
  //         "Access token refreshed successfully"
  //       )
  //     );
  // } catch (error) {
  //   new apiError(401, error?.message || "Invalid refresh token");
  // }

  const user = await User.findOne({
    refreshToken: incomingRefreshToken,
  });
  if (!user) throw new apiError(401, "Invalid refresh token");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        { accessToken, refreshToken },
        "Access token refreshed"
      )
    );
});

export function checkRole(role) {
  return (req, res, next) => {
    // Assuming user information is stored in req.user
    const user = req;
    if (user && user.roles && user.roles.includes(role)) {
      // User has the required role, proceed to the next middleware or route handler
      next();
    } else {
      // User does not have the required role, send a forbidden response
      res.status(403).send("Forbidden");
    }
  };
}

// Change Current Password of a user
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  const user = await User.findById(req.user?.id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new apiError(401, "Your oldpassword is invalid");
  }

  if (!(newPassword === confirmPassword)) {
    throw new apiError(
      400,
      "Your new password and confirm password does not match"
    );
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new apiResponse(200, {}, "Your password has been changed successfully")
    );
});

// Get Current User
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, req.user, "User fetched successfully"));
});

// Upate user details or account
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!(fullName || email)) {
    throw new apiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?.id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");

  await EmailVerification.create({
    userId: user._id,
    email: user.email,
  });

  return res
    .status(200)
    .json(new apiResponse(200, user, "Account updated successfully"));
});

// Update user avatar or profile pic
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new apiError(400, "No image provided!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new apiError(400, "Error while uploading file on cloudinary");
  }

  // To delete previous avatar
  const user = req.user;
  const oldAvatar = user?.avatar;

  const updatedUser = await User.findByIdAndUpdate(
    req.user?.id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  // removing old avatar from cloudinary
  await removeFileFromCloudinary(oldAvatar);

  return res
    .status(200)
    .json(new apiResponse(200, updatedUser, "Avatar updated successfully"));
});

// Update user cover image
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const user = req.user;

  const newCoverImage = req.file?.path;
  if (!newCoverImage) throw new apiError(404, "Cover Image not found");

  const cloudinaryFileURL = await uploadOnCloudinary(newCoverImage);
  if (!cloudinaryFileURL?.url)
    throw new apiError(500, "Error while updating cover image");

  const data = await User.findByIdAndUpdate(user.id, {
    coverImage: cloudinaryFileURL?.url,
  });

  if (!data) throw new apiError(500, "User was not updated");
  if (data?.coverImage) {
    removeFileFromCloudinary(data.coverImage);
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { coverImage: cloudinaryFileURL.url },
        "Cover imaged updated"
      )
    );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  if (!userName?.trim()) {
    throw new apiError(200, "User name is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "followers",
        localField: "_id",
        foreignField: "channel",
        as: "followers",
      },
    },
    {
      $lookup: {
        from: "followers",
        localField: "_id",
        foreignField: "follower",
        as: "followedTo",
      },
    },
    {
      $addFields: {
        followersCount: {
          $size: "$followers",
        },
        channelsFollowedToCount: {
          $size: "$followedTo",
        },
        isFollowed: {
          $cond: {
            if: { $in: [req.user?.id, "$followers.follower"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        followersCount: 1,
        channelsFollowedToCount: 1,
        isFollowed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new apiError(404, "Channel doesnot exists");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getUserProfile = asyncHandler(async (req, res, next) => {
  try {
    const { userName } = req.params;
    if (!userName?.trim()) throw new apiError(400, "User name us required");

    const user = await User.findOne(
      { userName },
      {
        _id: 1,
        userName: 1,
        fullName: 1,
        emailVerified: 1,
        role: 1,
        createdAt: 1,
        coverImage: 1,
        avatar: 1,
      }
    );
    if (!user) throw new apiError(404, "User not found");

    return res.status(200).json(new apiResponse(200, user));
  } catch (error) {
    next(error);
  }
});

// Change role
const changeRole = asyncHandler(async (req, res, next) => {
  try {
    const currentUserId = req.user?.id;
    const userId = req.params.id;
    const { newRole } = req.body;

    if (!newRole) {
      throw new apiError(401, "Role is required!");
    }

    if (currentUserId === userId)
      throw new apiError(500, "You cannot change your own role");

    const updatedRole = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true, runValidators: true, select: "-password -refreshToken" }
    );
    return res
      .status(200)
      .json({ data: updatedRole, message: "Successfully role updated" });
  } catch (error) {
    next(error);
  }
});

const deleteUser = asyncHandler(async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) throw new apiError(401, "User Id is required");
    await User.deleteOne({ _id: userId });

    return res.status(200).json(new apiResponse(200, userId, "User deleted!"));
  } catch (error) {
    next(error);
  }
});

const getAllUser = asyncHandler(async (req, res, next) => {
  try {
    const users = await User.find().select("-password -refreshToken");
    return res
      .status(200)
      .json(
        new apiResponse(200, { count: users.length, users }, "Users fetched")
      );
  } catch (error) {
    next(error);
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  changeRole,
  verifyEmail,
  resetPassword,
  deleteUser,
  getAllUser,
  resendVerification,
  getUserProfile,
};
