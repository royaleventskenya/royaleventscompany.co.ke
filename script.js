<script>
  document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-links');

    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });

    // Close menu after clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
      });
    });
  });
</script>
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔐 M-PESA CREDENTIALS
const consumerKey = "YOUR_CONSUMER_KEY";
const consumerSecret = "YOUR_CONSUMER_SECRET";
const shortcode = "174379"; // test
const passkey = "YOUR_PASSKEY";
const callbackURL = "https://your-backend.com/callback";

// 🔑 Generate Access Token
async function getAccessToken() {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    const res = await axios.get(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        { headers: { Authorization: `Basic ${auth}` } }
    );

    return res.data.access_token;
}

// 📲 STK PUSH
app.post("/stkpush", async (req, res) => {
    try {
        const { phone, amount } = req.body;

        const token = await getAccessToken();

        const timestamp = moment().format("YYYYMMDDHHmmss");
        const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");

        const stkRes = await axios.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            {
                BusinessShortCode: shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: amount,
                PartyA: phone,
                PartyB: shortcode,
                PhoneNumber: phone,
                CallBackURL: callbackURL,
                AccountReference: "Luxury Safari Event",
                TransactionDesc: "Event Booking Payment"
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        res.json(stkRes.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).send("STK Push failed");
    }
});

// 📩 CALLBACK (Payment confirmation)
app.post("/callback", (req, res) => {
    console.log("M-Pesa Callback:", JSON.stringify(req.body, null, 2));

    // 👉 Here you:
    // - Confirm payment
    // - Mark invoice as PAID
    // - Send receipt email

    res.sendStatus(200);
});

// 📄 INVOICE GENERATOR
app.post("/invoice", (req, res) => {
    const { clientName, amount, email } = req.body;

    const invoiceId = uuidv4();
    const filePath = `invoice-${invoiceId}.pdf`;

    const doc = new PDFDocument();

    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text("LUXURY SAFARI EVENTS", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Invoice ID: ${invoiceId}`);
    doc.text(`Client: ${clientName}`);
    doc.text(`Amount: $${amount}`);
    doc.text(`Date: ${moment().format("YYYY-MM-DD")}`);
    doc.moveDown();

    doc.text("Description: Event Booking Deposit");

    doc.end();

    doc.on("finish", () => {
        res.download(filePath);
    });
});

// 🚀 START SERVER
app.listen(3000, () => console.log("Server running on port 3000"));
