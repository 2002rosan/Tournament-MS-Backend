import nodemailer from "nodemailer";

const sendEmail = async (option) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      auth: {
        user: "rosan.91111@gmail.com",
        pass: "iyfa gyvj rdag tnem",
      },
    });

    const mailOption = {
      from: '"TMS" <rosan.91111@gmail.com>', // sender address
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
