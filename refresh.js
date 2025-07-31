const axios = require("axios");
require("dotenv").config();

async function refreshAccessToken() {
  const res = await axios.post("https://slack.com/api/oauth.v2.access", null, {
    params: {
      grant_type: "refresh_token",
      refresh_token: process.env.REFRESH_TOKEN,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
    },
  });

  if (!res.data.ok) throw new Error("Slack token refresh failed");

  return {
    access_token: res.data.access_token,
    refresh_token: res.data.refresh_token,
    expires_in: res.data.expires_in,
  };
}

module.exports = { refreshAccessToken };
