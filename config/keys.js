dbPassword = 'mongodb+srv://pd_auth_admin:'+ encodeURIComponent(process.env.DB_PASS) + '@pd-auth-dtqjz.mongodb.net/test?retryWrites=true';

module.exports = {
  mongoURI: dbPassword,
  recaptcha: {
    siteKey: '6Lcr5-kUAAAAAFUWp_nBJkXnoWWW0DbJR7CMxHmF',
    secret: process.env.CAPTCHA_KEY
  },
  email: {
    service: 'Mail.Ru',
    auth: {
      user: 'puzzleduel.club@mail.ru',
      pass: process.env.EMAIL_PASS
    }
  }
};
