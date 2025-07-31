const express = require("express");
const bodyParser = require("body-parser");
const { WebClient } = require("@slack/web-api");
const { connectDB, getDB } = require("./db");
require("dotenv").config();

// process.on('uncaughtException', (err) => {
//   console.log('uncaught Exception', err.stack);
// })

const slackClient = new WebClient(process.env.SLACK_OAUTH_TOKEN);

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

function breakdownTextToWords(text) {
    // Remove leading and trailing whitespace, then split the string into words
    return text.trim().split(/\s+/).map(word => word.replace(/[*_]/g, ''));
}

let message;

app.post("/slack/command", async (req, res) => {
  try {
    const { text, user_id, channel_id, response_url } = req.body;
    const args = breakdownTextToWords(text);

    if (args.length < 2) {
      message = '☠️ _Invalid Input_ ☠️\nUsage: /statuscode <refId>\nUsage: /agent <refId>';
    }

    const db = getDB();
    const loanrequest = await db.collection("loanrequest")
      .findOne({ referencenumber: args[1] });

    switch (args[0]) {
      case 'statuscode':
        console.log('fetching statuscode for refId:', args[1]);
        if (loanrequest) {
          message = `refId _*${args[1]}*_\n👀\tstatuscode: ${loanrequest.statuscode}`;
        } else {
          message = `No loan request found for refId ${args[1]}`;
        }
        break;

      case 'agent':
        console.log('fetching assigned agent for refId:', args[1]);
        if (!loanrequest) {
          message = `No loan request found for refId ${args[1]}`;
        } else {
          const agentId = loanrequest.statuscode < 6
            ? loanrequest.assignedagent
            : loanrequest.releaseagent;
          const agent = await db.collection("user")
            .findOne({ _id: agentId });
          if (agent)
            message = `refId _*${args[1]}*_ agent details\n${loanrequest.statuscode < 6 ? '🄐\t  Assigned Agent' : '🄡 Release Agent'}\n🙋‍♂️\t${agentId}\n🤳\t${agent.phone}`;
          else
            message = 'No agent found for refId ' + args[1];
        }
        break;
    }

    console.log('Sending message:', message);

    await slackClient.chat.postMessage({
      channel: channel_id,
      text: message,
    });

    res.status(200).end();
  } catch (err) {
    console.log('Error occured: ', err);
  }
});

(async () => {
  await connectDB();
  app.listen(process.env.PORT, () =>
    console.log(`🚀 Slack bot running on port ${process.env.PORT}`)
  );
})();
