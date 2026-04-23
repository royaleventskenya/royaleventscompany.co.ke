const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Royal Events Backend is running 🚀");
});

// MPESA STK PUSH ROUTE
app.post("/stkpush", async (req, res) => {
  const { phone, amount } = req.body;

  try {
    // STEP 1: GET ACCESS TOKEN
    const auth = Buffer.from(
      process.env.CONSUMER_KEY + ":" + process.env.CONSUMER_SECRET
    ).toString("base64");

    const tokenResponse = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // STEP 2: STK PUSH REQUEST
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);

    const password = Buffer.from(
      process.env.SHORTCODE +
        process.env.PASSKEY +
        timestamp
    ).toString("base64");

    const stkResponse = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: process.env.SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: process.env.SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: process.env.CALLBACK_URL,
        AccountReference: "RoyalEvents",
        TransactionDesc: "Payment",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    res.json(stkResponse.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CALLBACK ROUTE
app.post("/callback", (req, res) => {
  console.log("MPESA CALLBACK:", req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
