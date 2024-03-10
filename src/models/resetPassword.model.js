import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.utils.js";

const resetPWSchema = new Schema(
  {
    resetPWTimeFrame: Number, // Time in seconds that the password is valid for
    // expiryDate: {
    //   type: Date,
    //   index: { expires: process.env.RESET_PASSWORD_EXPIRY + "ms" },
    //   default: Date.now(),
    // },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    code: Number,
    email: String,
  },
  { timestamps: true }
);

// resetPWSchema.index(
//   { expiryDate: 1 },
//   { expireAfterSeconds: process.env.RESET_PASSWORD_EXPIRY }
// );

resetPWSchema.pre("save", async function (next) {
  const resetCode = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");

  this.code = resetCode;
  const hashCode = jwt.sign(
    {
      id: this._id,
      userId: this.userId,
      code: resetCode,
    },
    process.env.RESET_PASSWORD_SECRET,
    { expiresIn: process.env.RESET_PASSWORD_EXPIRY }
  );

  //   const emailText = `Click the link to verify your email\n ${process.env.BASE_URL}/reset-password/new?code=${hashCode}`;
  const emailText = `Click the link to verify your email\n ${process.env.API_URL}/api/users/reset-password?code=${hashCode}`;
  const option = {
    to: this.email,
    subject: "TMS Reset password",
    text: emailText,
  };
  sendEmail(option);
  next();
});

export const ResetPassword = mongoose.model("ResetPassword", resetPWSchema);
