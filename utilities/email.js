const nodemailer = require(`nodemailer`);
const pug = require(`pug`);
const htmlTotext = require(`html-to-text`);

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(` `)[0];
    this.url = url;
    this.from = `Ognjen Popović <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === `production`) {
      return 1;
    }

    return nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: 'a0c107c231d697',
        pass: 'b0a2a3a22cdeb6',
      },
    });
  }

  async send(template, subject) {
    // 1) Render HTML for email based on pug template
    const html = pug.renderFile(`${__dirname}/../emails/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlTotext.htmlToText(html),
    };

    // 3) Creaate a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send(`Welcome`, `Welcome to the natours family!`);
  }

  async sendPasswordReset() {
    await this.send(
      `passwordReset`,
      `Your password reset token ( valid for only 10 minutes )`
    );
  }
};
