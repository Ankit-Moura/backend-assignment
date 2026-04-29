const axios = require("axios")

const WEBHOOK_URL = process.env.WEBHOOK_URL

async function sendWebhook(payload, retries = 3) {
  let delay = 1000 // 1s

  for (let i = 0; i < retries; i++) {
    try {
      await axios.post(WEBHOOK_URL, payload)
      console.log("Webhook sent successfully")
      return
    } catch (err) {
      console.log(`Webhook failed attempt ${i + 1}`)

      if (i === retries - 1) {
        console.log("Webhook failed permanently")
        return
      }

      await new Promise(res => setTimeout(res, delay))
      delay *= 2 // exponential backoff
    }
  }
}

module.exports = { sendWebhook }