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
  const code = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");

  this.code = code;
  // Generate token and save
  const hashcode = jwt.sign(
    {
      id: this._id,
      code,
      email: this.email,
      userId: this.userId,
    },
    process.env.EMAIL_VERIFICATION_SECRET_CODE,
    {
      expiresIn: process.env.EMAIL_VERIFICATION_CODE_EXPIRY,
    }
  );

  const emailText = `Click the link to verify your email\n ${process.env.API_URL}/api/users/verify-email?code=${hashcode}`;

  const option = {
    to: this.email,
    subject: "TMS Verification code",
    text: emailText,
    // html: `<span>Hello World?</span>`,
  };
  sendEmail(option);
  next();
});

emailVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

export const EmailVerification = mongoose.model(
  "EmailVerification",
  emailVerificationSchema
);
