import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.utils.js";

const emailVerificationSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    email: {
      type: String,
    },
    code: {
      type: Number,
      require: true,
      trim: true,
    },
  },
  { timestamps: true }
);

emailVerificationSchema.pre("save", async function (next) {
  const code = jwt.sign(
    {
      id: this._id,
      code: this.code,
    },
    process.env.EMAIL_VERIFICATION_SECRET_CODE,
    {
      expiresIn: process.env.EMAIL_VERIFICATION_CODE_EXPIRY,
    }
  );
  console.log(["code", code]);
  const option = {
    to: this.email,
    subject: "TMS Verification code",
    text: `Your verification code is : ${code}`,
    html: "<b>Hello World?</b>",
  };
  sendEmail(option);
  next();
});

export const EmailVerification = mongoose.model(
  "EmailVerification",
  emailVerificationSchema
);
