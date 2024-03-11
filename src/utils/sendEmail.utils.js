import nodemailer from "nodemailer";

const sendEmail = async (option) => {
  const email = process.env.APP_EMAIL;
  const emailPass = process.env.EMAIL_PASS;
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      auth: {
        user: email,
        pass: emailPass,
      },
    });

    const mailOption = {
      from: `"TMS" <${email}>`, // sender address
      to: option.to, // list of receivers
      subject: option.subject, // Subject line
      text: option.text,
    };
    if (option.html) {
      mailOption.html = option.html;
    }
    const info = await transporter.sendMail(mailOption);
    return info;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export default sendEmail;
