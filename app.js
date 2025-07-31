const express = require("express");
const bodyParser = require("body-parser");
const { WebClient } = require("@slack/web-api");
const { connectDB, getDB } = require("./db");
require("dotenv").config();

let accessToken = process.env.ACCESS_TOKEN;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/slack/command", async (req, res) => {
  const { text, response_url } = req.body;
  const phone = text.trim();

  if (!phone) {
    return res.send("Usage: /findemail <phone>");
  }

  const db = getDB();
  const user = await db.collection("user").findOne({ phone: phone });

  const slackClient = new WebClient(accessToken);

  const message = user
    ? `📧 Email for *${phone}* is \`${user.email}\``
    : `🙁 No user found with phone: *${phone}*`;

  console.log(message);

  // Respond via response_url (so you don’t need to wait)
  await fetch(response_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });

  res.status(200).end(); // Respond immediately to Slack
});

(async () => {
  await connectDB();
  app.listen(process.env.PORT, () => {
    console.log(`🚀 Server running on port ${process.env.PORT}`);
  });
})();
