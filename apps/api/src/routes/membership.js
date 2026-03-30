// import express from "express";
// import axios from "axios";
// import crypto from "crypto";
// import PocketBase from "pocketbase";

// const router = express.Router();

// // Initialize PocketBase
// const pb = new PocketBase(
//   process.env.POCKETBASE_URL || "http://localhost:8090",
// );
// pb.autoCancellation(false);

// // Paystack configuration
// const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
// const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;
// const PAYSTACK_API_BASE = "https://api.paystack.co";

// // Currency conversion — Paystack account is KES, prices are in USD
// // Update USD_TO_KES_RATE periodically if precision matters
// const USD_TO_KES_RATE = 129;

// // Membership tiers — amounts converted to KES kobo (Paystack smallest unit)
// const MEMBERSHIP_TIERS = {
//   Standard: {
//     price: 500,
//     amount_kobo: Math.round(500 * USD_TO_KES_RATE * 100),
//   },
//   Premium: { price: 999, amount_kobo: Math.round(999 * USD_TO_KES_RATE * 100) },
//   Elite: { price: 1499, amount_kobo: Math.round(1499 * USD_TO_KES_RATE * 100) },
// };

// const REFUND_WINDOW_DAYS = 7;

// const getTimestamp = () => new Date().toISOString();

// /**
//  * Authenticate PocketBase — uses collection('users') to match the working
//  * paystack.js pattern.
//  */
// const authenticatePocketBase = async () => {
//   try {
//     if (!pb.authStore.isValid) {
//       console.log(
//         `[${getTimestamp()}] [Membership] Authenticating with PocketBase...`,
//       );
//       await pb
//         .collection("users")
//         .authWithPassword(
//           process.env.POCKETBASE_ADMIN_EMAIL,
//           process.env.POCKETBASE_ADMIN_PASSWORD,
//         );
//       console.log(
//         `[${getTimestamp()}] [Membership] PocketBase authentication successful`,
//       );
//     }
//   } catch (error) {
//     console.error(
//       `[${getTimestamp()}] [Membership] PocketBase authentication failed:`,
//       error.message,
//     );
//     throw new Error("Database authentication failed: " + error.message);
//   }
// };

// /**
//  * Verify Paystack webhook signature
//  */
// const verifyPaystackSignature = (payload, signature) => {
//   if (!PAYSTACK_WEBHOOK_SECRET) {
//     console.error(
//       `[${getTimestamp()}] [Membership] PAYSTACK_WEBHOOK_SECRET is not set in .env`,
//     );
//     return false;
//   }
//   const hash = crypto
//     .createHmac("sha512", PAYSTACK_WEBHOOK_SECRET)
//     .update(JSON.stringify(payload))
//     .digest("hex");
//   return hash === signature;
// };

// /**
//  * Calculate refund eligibility based on purchase date
//  */
// const calculateRefundEligibility = (purchaseDate) => {
//   const now = new Date();
//   const purchase = new Date(purchaseDate);
//   const diffTime = now - purchase;
//   const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
//   const daysRemaining = Math.max(0, REFUND_WINDOW_DAYS - diffDays);
//   const eligible = diffDays < REFUND_WINDOW_DAYS;

//   return { eligible, daysRemaining, daysSincePurchase: diffDays };
// };

// /**
//  * POST /membership/initiate-payment
//  * Initializes a Paystack payment for a membership tier.
//  * Expects userId and tier in request body (like paystack.js)
//  */
// router.post("/initiate-payment", async (req, res) => {
//   console.log(`[${getTimestamp()}] [Membership] Received initiate-payment request`);

//   try {
//     const { tier, userId, userEmail } = req.body; // ← Get email from frontend too

//     // Validate required fields
//     if (!userId) {
//       console.warn(`[${getTimestamp()}] [Membership] Missing userId`);
//       return res.status(400).json({ error: "Missing userId parameter" });
//     }

//     if (!userEmail) {
//       console.warn(`[${getTimestamp()}] [Membership] Missing userEmail`);
//       return res.status(400).json({ error: "Missing userEmail parameter" });
//     }

//     if (!tier) {
//       console.warn(`[${getTimestamp()}] [Membership] Missing tier`);
//       return res.status(400).json({ error: "Missing tier parameter" });
//     }

//     if (!MEMBERSHIP_TIERS[tier]) {
//       console.warn(`[${getTimestamp()}] [Membership] Invalid tier: ${tier}`);
//       return res.status(400).json({
//         error: "Invalid tier. Must be one of: Standard, Premium, Elite",
//         validTiers: Object.keys(MEMBERSHIP_TIERS),
//       });
//     }

//     // Note: We DON'T need to fetch the user from PocketBase
//     // We just use the userId and userEmail from the frontend
//     // This matches the pattern in paystack.js

//     const tierData = MEMBERSHIP_TIERS[tier];
//     console.log(
//       `[${getTimestamp()}] [Membership] Initiating payment — tier: ${tier}, USD: $${tierData.price}, kobo: ${tierData.amount_kobo}, user: ${userId}, email: ${userEmail}`,
//     );

//     const metadata = {
//       userId,
//       tier,
//       type: "membership",
//       usdAmount: tierData.price,
//       kesAmount: tierData.price * USD_TO_KES_RATE,
//       exchangeRate: USD_TO_KES_RATE,
//     };

//     const response = await axios.post(
//       `${PAYSTACK_API_BASE}/transaction/initialize`,
//       {
//         email: userEmail, // ← Use email from frontend
//         amount: tierData.amount_kobo,
//         metadata,
//         callback_url: `${process.env.FRONTEND_URL || "https://www.velocitygloballeasing.com"}/membership/success`,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
//           "Content-Type": "application/json",
//         },
//       },
//     );

//     if (!response.data.status) {
//       console.error(
//         `[${getTimestamp()}] [Membership] Paystack API error: ${response.data.message}`,
//       );
//       return res.status(400).json({ error: response.data.message });
//     }

//     const { authorization_url, reference } = response.data.data;
//     console.log(
//       `[${getTimestamp()}] [Membership] Payment initialized. Reference: ${reference}`,
//     );

//     return res.status(200).json({ authorization_url, reference });
//   } catch (error) {
//     console.error(
//       `[${getTimestamp()}] [Membership] initiate-payment error:`,
//       error.message,
//     );
    
//     if (error.response?.data) {
//       console.error(`[${getTimestamp()}] [Membership] API error details:`, error.response.data);
//     }
    
//     return res
//       .status(500)
//       .json({ error: "Failed to initiate payment", details: error.message });
//   }
// });

// /**
//  * POST /membership/verify
//  * Verifies a membership payment and returns membership details
//  */
// router.post("/verify", async (req, res) => {
//   console.log(`[${getTimestamp()}] [Membership] Received verify request`);

//   try {
//     const { reference } = req.body;

//     if (!reference) {
//       return res.status(400).json({ success: false, message: 'Missing reference' });
//     }

//     console.log(`[${getTimestamp()}] [Membership] Verifying membership payment: ${reference}`);

//     // First, check if membership already exists in our database
//     await authenticatePocketBase();

//     try {
//       // Try to find the membership by payment reference
//       const membership = await pb
//         .collection("user_memberships")
//         .getFirstListItem(`payment_reference="${reference}"`);

//       console.log(`[${getTimestamp()}] [Membership] Found membership: ${membership.id}`);

//       return res.status(200).json({
//         success: true,
//         message: 'Membership verified successfully!',
//         data: {
//           membership: {
//             id: membership.id,
//             tier: membership.tier,
//             purchase_date: membership.purchase_date,
//             status: membership.status,
//             amount_paid: membership.amount_paid
//           }
//         }
//       });
//     } catch (notFoundError) {
//       // Membership not found yet - maybe webhook hasn't processed
//       console.log(`[${getTimestamp()}] [Membership] Membership not found, checking Paystack...`);

//       // Verify with Paystack directly
//       const paystackResponse = await axios.get(
//         `${PAYSTACK_API_BASE}/transaction/verify/${reference}`,
//         {
//           headers: {
//             Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
//           }
//         }
//       );

//       if (!paystackResponse.data.status) {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'Payment verification failed' 
//         });
//       }

//       const transaction = paystackResponse.data.data;

//       if (transaction.status !== 'success') {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'Payment not successful' 
//         });
//       }

//       // Payment is successful but membership not created yet (webhook delayed)
//       // Return success anyway - webhook will create it soon
//       const metadata = transaction.metadata || {};
      
//       return res.status(200).json({
//         success: true,
//         message: 'Payment confirmed! Your membership will be activated shortly.',
//         data: {
//           pending: true,
//           tier: metadata.tier,
//           reference: reference
//         }
//       });
//     }
//   } catch (error) {
//     console.error(`[${getTimestamp()}] [Membership] Verify error:`, error.message);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to verify membership',
//       details: error.message
//     });
//   }
// });

// /**
//  * POST /membership/webhook
//  * Receives Paystack webhook events and activates membership on charge.success.
//  */
// router.post("/webhook", async (req, res) => {
//   console.log(`[${getTimestamp()}] [Membership] Received webhook`);

//   try {
//     const signature = req.headers["x-paystack-signature"];
//     const payload = req.body;

//     if (!signature || !verifyPaystackSignature(payload, signature)) {
//       console.warn(
//         `[${getTimestamp()}] [Membership] Webhook signature verification failed`,
//       );
//       return res.status(200).json({ message: "Event received" });
//     }

//     const event = payload.event;
//     console.log(`[${getTimestamp()}] [Membership] Event: ${event}`);

//     if (event !== "charge.success") {
//       return res.status(200).json({ message: "Event received" });
//     }

//     const { reference, status, amount, metadata } = payload.data;

//     if (status !== "success") {
//       return res.status(200).json({ message: "Event received" });
//     }

//     const { userId, tier } = metadata || {};

//     if (!userId || !tier) {
//       console.error(
//         `[${getTimestamp()}] [Membership] Missing userId or tier in webhook metadata`,
//       );
//       return res.status(200).json({ message: "Event received" });
//     }

//     await authenticatePocketBase();

//     // Idempotency check — don't create duplicate memberships
//     try {
//       const existing = await pb
//         .collection("user_memberships")
//         .getFirstListItem(
//           `user_id="${userId}" && payment_reference="${reference}"`,
//         );
//       if (existing) {
//         console.log(
//           `[${getTimestamp()}] [Membership] Membership already exists: ${existing.id}`,
//         );
//         return res.status(200).json({ message: "Event received" });
//       }
//     } catch (e) {
//       // Not found — proceed to create
//     }

//     const tierData = MEMBERSHIP_TIERS[tier];
//     const membership = await pb.collection("user_memberships").create({
//       user_id: userId,
//       tier,
//       purchase_date: new Date().toISOString(),
//       status: "active",
//       payment_reference: reference,
//       refund_eligible: true,
//       refund_processed: false,
//       amount_paid: tierData ? tierData.price : amount / 100,
//     });

//     console.log(
//       `[${getTimestamp()}] [Membership] Membership created: ${membership.id}`,
//     );

//     // Send confirmation email (non-fatal if it fails)
//     try {
//       const user = await pb.collection("users").getOne(userId);
//       if (user.email && tierData) {
//         const emailSubject = `Welcome to ${tier} Membership - Velocity Global Leasing`;
//         const emailBody = `
// <!DOCTYPE html>
// <html>
// <head>
//   <style>
//     body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//     .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//     .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
//     .header h2 { margin: 0; }
//     .field { margin-bottom: 15px; }
//     .field-label { font-weight: bold; color: #2c3e50; margin-bottom: 5px; }
//     .field-value { background-color: #f8f9fa; padding: 10px; border-left: 3px solid #3498db; }
//     .benefits { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin-top: 20px; }
//     .benefits h3 { margin-top: 0; color: #2c3e50; }
//     .benefits ul { margin: 10px 0; padding-left: 20px; }
//     .benefits li { margin-bottom: 8px; }
//     .cta-button { display: inline-block; background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
//     .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #7f8c8d; }
//   </style>
// </head>
// <body>
//   <div class="container">
//     <div class="header"><h2>Welcome to ${tier} Membership!</h2></div>
//     <div class="content">
//       <p>Thank you for upgrading to our ${tier} membership. Your account is now active.</p>
//       <div class="field">
//         <div class="field-label">Membership Tier:</div>
//         <div class="field-value">${tier}</div>
//       </div>
//       <div class="field">
//         <div class="field-label">Amount Paid:</div>
//         <div class="field-value">$${tierData.price}</div>
//       </div>
//       <div class="field">
//         <div class="field-label">Purchase Date:</div>
//         <div class="field-value">${new Date().toLocaleDateString()}</div>
//       </div>
//       <div class="field">
//         <div class="field-label">Refund Deadline:</div>
//         <div class="field-value">${new Date(Date.now() + REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
//       </div>
//       <p style="color: #e74c3c; font-weight: bold;">You have 7 days from purchase to cancel and receive a full refund.</p>
//       <div class="benefits">
//         <h3>Your ${tier} Membership Includes:</h3>
//         <ul>
//           <li>Access to exclusive seminars and webinars</li>
//           <li>Private Slack community with industry experts</li>
//           <li>Weekly industry reports and market analysis</li>
//           <li>Special discounts on premium courses</li>
//           <li>Priority support from our team</li>
//         </ul>
//       </div>
//       <a href="https://velocitygloballeasing.com/dashboard" class="cta-button">Go to Dashboard</a>
//     </div>
//     <div class="footer">
//       <p>This email was sent from Velocity Global Leasing.</p>
//       <p>Questions? Contact us at support@velocitygloballeasing.com</p>
//     </div>
//   </div>
// </body>
// </html>`.trim();

//         await pb.sendSuperuserEmail(user.email, emailSubject, emailBody);
//         console.log(
//           `[${getTimestamp()}] [Membership] Confirmation email sent to ${user.email}`,
//         );
//       }
//     } catch (emailErr) {
//       console.warn(
//         `[${getTimestamp()}] [Membership] Failed to send confirmation email:`,
//         emailErr.message,
//       );
//     }

//     return res.status(200).json({ success: true });
//   } catch (error) {
//     console.error(
//       `[${getTimestamp()}] [Membership] Webhook error:`,
//       error.message,
//     );
//     // Always return 200 to Paystack so it doesn't retry
//     return res.status(200).json({ message: "Event received" });
//   }
// });

// /**
//  * GET /membership/status
//  * Returns the current user's active membership, or { hasMembership: false }.
//  * Expects userId as query parameter.
//  */
// router.get("/status", async (req, res) => {
//   console.log(`[${getTimestamp()}] [Membership] Received status request`);

//   try {
//     const { userId } = req.query;

//     if (!userId) {
//       console.warn(`[${getTimestamp()}] [Membership] Missing userId parameter`);
//       return res.status(400).json({ error: "Missing userId parameter" });
//     }

//     await authenticatePocketBase();

//     try {
//       const membership = await pb
//         .collection("user_memberships")
//         .getFirstListItem(`user_id="${userId}" && status="active"`, {
//           sort: "-purchase_date",
//         });

//       const refundInfo = calculateRefundEligibility(membership.purchase_date);

//       return res.status(200).json({
//         hasMembership: true,
//         tier: membership.tier,
//         purchase_date: membership.purchase_date,
//         status: membership.status,
//         refund_eligible: refundInfo.eligible,
//         days_remaining: refundInfo.daysRemaining,
//       });
//     } catch (e) {
//       return res.status(200).json({ hasMembership: false });
//     }
//   } catch (error) {
//     console.error(
//       `[${getTimestamp()}] [Membership] Status error:`,
//       error.message,
//     );
//     return res.status(500).json({ error: "Failed to fetch membership status" });
//   }
// });

// /**
//  * GET /membership/refund-eligible
//  * Returns refund eligibility details for the current user's active membership.
//  * Expects userId as query parameter.
//  */
// router.get("/refund-eligible", async (req, res) => {
//   console.log(
//     `[${getTimestamp()}] [Membership] Received refund-eligible request`,
//   );

//   try {
//     const { userId } = req.query;

//     if (!userId) {
//       console.warn(`[${getTimestamp()}] [Membership] Missing userId parameter`);
//       return res.status(400).json({ error: "Missing userId parameter" });
//     }

//     await authenticatePocketBase();

//     try {
//       const membership = await pb
//         .collection("user_memberships")
//         .getFirstListItem(`user_id="${userId}" && status="active"`, {
//           sort: "-purchase_date",
//         });

//       const refundInfo = calculateRefundEligibility(membership.purchase_date);
//       const tierData = MEMBERSHIP_TIERS[membership.tier];

//       return res.status(200).json({
//         eligible: refundInfo.eligible,
//         days_remaining: refundInfo.daysRemaining,
//         refund_amount: refundInfo.eligible && tierData ? tierData.price : 0,
//         tier: membership.tier,
//       });
//     } catch (e) {
//       return res
//         .status(200)
//         .json({
//           eligible: false,
//           days_remaining: 0,
//           refund_amount: 0,
//           tier: null,
//         });
//     }
//   } catch (error) {
//     console.error(
//       `[${getTimestamp()}] [Membership] Refund-eligible error:`,
//       error.message,
//     );
//     return res
//       .status(500)
//       .json({ error: "Failed to check refund eligibility" });
//   }
// });

// /**
//  * POST /membership/cancel
//  * Cancels the user's active membership and processes a refund if within the window.
//  * Expects userId in request body.
//  */
// router.post("/cancel", async (req, res) => {
//   console.log(`[${getTimestamp()}] [Membership] Received cancel request`);

//   try {
//     const { userId } = req.body;

//     if (!userId) {
//       console.warn(`[${getTimestamp()}] [Membership] Missing userId parameter`);
//       return res.status(400).json({ error: "Missing userId parameter" });
//     }

//     await authenticatePocketBase();

//     let membership;
//     try {
//       membership = await pb
//         .collection("user_memberships")
//         .getFirstListItem(`user_id="${userId}" && status="active"`, {
//           sort: "-purchase_date",
//         });
//     } catch (e) {
//       return res.status(400).json({ error: "No active membership found" });
//     }

//     const refundInfo = calculateRefundEligibility(membership.purchase_date);
//     const tierData = MEMBERSHIP_TIERS[membership.tier];
//     const refundAmount = refundInfo.eligible && tierData ? tierData.price : 0;
//     let refundProcessed = false;

//     // Attempt Paystack refund if within window
//     if (refundInfo.eligible && tierData) {
//       console.log(
//         `[${getTimestamp()}] [Membership] Processing refund for reference: ${membership.payment_reference}`,
//       );
//       try {
//         const refundResponse = await axios.post(
//           `${PAYSTACK_API_BASE}/refund`,
//           {
//             transaction: membership.payment_reference,
//             amount: tierData.amount_kobo,
//           },
//           {
//             headers: {
//               Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
//               "Content-Type": "application/json",
//             },
//           },
//         );

//         if (refundResponse.data.status) {
//           refundProcessed = true;
//           console.log(
//             `[${getTimestamp()}] [Membership] Refund processed successfully`,
//           );
//         } else {
//           console.error(
//             `[${getTimestamp()}] [Membership] Refund API error:`,
//             refundResponse.data.message,
//           );
//         }
//       } catch (refundErr) {
//         console.error(
//           `[${getTimestamp()}] [Membership] Refund request failed:`,
//           refundErr.message,
//         );
//       }
//     }

//     // Update membership record
//     await pb.collection("user_memberships").update(membership.id, {
//       status: "cancelled",
//       cancellation_date: new Date().toISOString(),
//       refund_eligible: refundInfo.eligible,
//       refund_processed: refundProcessed,
//     });

//     console.log(
//       `[${getTimestamp()}] [Membership] Membership ${membership.id} cancelled`,
//     );

//     // Send cancellation email (non-fatal)
//     try {
//       const user = await pb.collection("users").getOne(userId);
//       if (user.email) {
//         const refundMessage = refundProcessed
//           ? `<p>A refund of <strong>$${refundAmount}</strong> has been processed. Please allow 5–7 business days.</p>`
//           : `<p>Your membership has been cancelled. The 7-day refund window has expired, so no refund will be issued.</p>`;

//         const emailBody = `
// <!DOCTYPE html>
// <html>
// <head>
//   <style>
//     body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//     .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//     .header { background-color: #e74c3c; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
//     .header h2 { margin: 0; }
//     .field { margin-bottom: 15px; }
//     .field-label { font-weight: bold; color: #2c3e50; margin-bottom: 5px; }
//     .field-value { background-color: #f8f9fa; padding: 10px; border-left: 3px solid #e74c3c; }
//     .cta-button { display: inline-block; background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
//     .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #7f8c8d; }
//   </style>
// </head>
// <body>
//   <div class="container">
//     <div class="header"><h2>Membership Cancelled</h2></div>
//     <div class="content">
//       ${refundMessage}
//       <div class="field">
//         <div class="field-label">Membership Tier:</div>
//         <div class="field-value">${membership.tier}</div>
//       </div>
//       <div class="field">
//         <div class="field-label">Cancellation Date:</div>
//         <div class="field-value">${new Date().toLocaleDateString()}</div>
//       </div>
//       ${
//         refundProcessed
//           ? `
//       <div class="field">
//         <div class="field-label">Refund Amount:</div>
//         <div class="field-value">$${refundAmount}</div>
//       </div>`
//           : ""
//       }
//       <p>We'd love to have you back! Contact us anytime at support@velocitygloballeasing.com</p>
//       <a href="https://velocitygloballeasing.com/membership" class="cta-button">View Membership Plans</a>
//     </div>
//     <div class="footer">
//       <p>This email was sent from Velocity Global Leasing.</p>
//     </div>
//   </div>
// </body>
// </html>`.trim();

//         await pb.sendSuperuserEmail(
//           user.email,
//           "Membership Cancelled - Velocity Global Leasing",
//           emailBody,
//         );
//         console.log(
//           `[${getTimestamp()}] [Membership] Cancellation email sent to ${user.email}`,
//         );
//       }
//     } catch (emailErr) {
//       console.warn(
//         `[${getTimestamp()}] [Membership] Failed to send cancellation email:`,
//         emailErr.message,
//       );
//     }

//     return res.status(200).json({
//       success: true,
//       message: refundProcessed
//         ? "Membership cancelled. Refund processed."
//         : "Membership cancelled. Refund period expired.",
//       refund_amount: refundAmount,
//     });
//   } catch (error) {
//     console.error(
//       `[${getTimestamp()}] [Membership] Cancel error:`,
//       error.message,
//     );
//     return res
//       .status(500)
//       .json({ error: "Failed to cancel membership", details: error.message });
//   }
// });

// export default router;


import express from "express";
import axios from "axios";
import crypto from "crypto";
import PocketBase from "pocketbase";

const router = express.Router();

const pb = new PocketBase(
  process.env.POCKETBASE_URL || "http://localhost:8090"
);
pb.autoCancellation(false);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;
const PAYSTACK_API_BASE = "https://api.paystack.co";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://www.velocitygloballeasing.com";

const USD_TO_KES_RATE = 129;

const MEMBERSHIP_TIERS = {
  Standard: {
    price: 500,
    amount_kobo: Math.round(500 * USD_TO_KES_RATE * 100),
  },
  Premium: {
    price: 999,
    amount_kobo: Math.round(999 * USD_TO_KES_RATE * 100),
  },
  Elite: {
    price: 1499,
    amount_kobo: Math.round(1499 * USD_TO_KES_RATE * 100),
  },
};

const REFUND_WINDOW_DAYS = 7;

const getTimestamp = () => new Date().toISOString();

const authenticatePocketBase = async () => {
  try {
    if (!pb.authStore.isValid) {
      console.log(`[${getTimestamp()}] [Membership] Authenticating with PocketBase...`);
      await pb.collection("users").authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL,
        process.env.POCKETBASE_ADMIN_PASSWORD
      );
      console.log(`[${getTimestamp()}] [Membership] PocketBase authentication successful`);
    }
  } catch (error) {
    console.error(`[${getTimestamp()}] [Membership] PocketBase authentication failed:`, error.message);
    throw new Error("Database authentication failed: " + error.message);
  }
};

const verifyPaystackSignature = (payload, signature) => {
  if (!PAYSTACK_WEBHOOK_SECRET) {
    console.error(`[${getTimestamp()}] [Membership] PAYSTACK_WEBHOOK_SECRET is not set`);
    return false;
  }
  const hash = crypto
    .createHmac("sha512", PAYSTACK_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");
  return hash === signature;
};

const calculateRefundEligibility = (purchaseDate) => {
  const now = new Date();
  const purchase = new Date(purchaseDate);
  const diffTime = now - purchase;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, REFUND_WINDOW_DAYS - diffDays);
  const eligible = diffDays < REFUND_WINDOW_DAYS;
  return { eligible, daysRemaining, daysSincePurchase: diffDays };
};

/**
 * POST /membership/initiate-payment
 * Initializes a Paystack payment for a membership tier.
 */
router.post("/initiate-payment", async (req, res) => {
  console.log(`[${getTimestamp()}] [Membership] Received initiate-payment request`);

  try {
    const { tier, userId, userEmail } = req.body;

    if (!userId) {
      console.warn(`[${getTimestamp()}] [Membership] Missing userId`);
      return res.status(400).json({ error: "Missing userId parameter" });
    }

    if (!userEmail) {
      console.warn(`[${getTimestamp()}] [Membership] Missing userEmail`);
      return res.status(400).json({ error: "Missing userEmail parameter" });
    }

    if (!tier) {
      console.warn(`[${getTimestamp()}] [Membership] Missing tier`);
      return res.status(400).json({ error: "Missing tier parameter" });
    }

    if (!MEMBERSHIP_TIERS[tier]) {
      console.warn(`[${getTimestamp()}] [Membership] Invalid tier: ${tier}`);
      return res.status(400).json({
        error: "Invalid tier. Must be one of: Standard, Premium, Elite",
        validTiers: Object.keys(MEMBERSHIP_TIERS),
      });
    }

    const tierData = MEMBERSHIP_TIERS[tier];
    console.log(
      `[${getTimestamp()}] [Membership] Initiating — tier: ${tier}, USD: $${tierData.price}, kobo: ${tierData.amount_kobo}, user: ${userId}`
    );

    // ─── Use custom_fields so Paystack reliably returns data on verify ───────
    // This matches the pattern in paystack.js that fixed the course checkout.
    const metadata = {
      cancel_action: `${FRONTEND_URL}/membership/cancel`,
      custom_fields: [
        {
          display_name: "User ID",
          variable_name: "userId",
          value: userId,
        },
        {
          display_name: "Membership Tier",
          variable_name: "tier",
          value: tier,
        },
        {
          display_name: "Transaction Type",
          variable_name: "type",
          value: "membership",
        },
        {
          display_name: "USD Amount",
          variable_name: "usdAmount",
          value: String(tierData.price),
        },
      ],
    };

    console.log(`[${getTimestamp()}] [Membership] Metadata:`, JSON.stringify(metadata));

    const response = await axios.post(
      `${PAYSTACK_API_BASE}/transaction/initialize`,
      {
        email: userEmail,
        amount: tierData.amount_kobo,
        metadata,
        callback_url: `${FRONTEND_URL}/membership/success`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.status) {
      console.error(`[${getTimestamp()}] [Membership] Paystack API error: ${response.data.message}`);
      return res.status(400).json({ error: response.data.message });
    }

    const { authorization_url, reference } = response.data.data;
    console.log(`[${getTimestamp()}] [Membership] Payment initialized. Reference: ${reference}`);

    return res.status(200).json({ authorization_url, reference });

  } catch (error) {
    console.error(`[${getTimestamp()}] [Membership] initiate-payment error:`, error.message);
    if (error.response?.data) {
      console.error(`[${getTimestamp()}] [Membership] API error details:`, error.response.data);
    }
    return res.status(500).json({ error: "Failed to initiate payment", details: error.message });
  }
});

/**
 * POST /membership/verify
 * Verifies a membership payment and returns membership details.
 * Extracts userId and tier from custom_fields — same pattern as paystack.js.
 */
router.post("/verify", async (req, res) => {
  console.log(`[${getTimestamp()}] [Membership] Received verify request`);

  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ success: false, message: "Missing reference" });
    }

    console.log(`[${getTimestamp()}] [Membership] Verifying payment: ${reference}`);

    await authenticatePocketBase();

    // First check if membership already exists in DB (webhook may have fired first)
    try {
      const membership = await pb
        .collection("user_memberships")
        .getFirstListItem(`payment_reference="${reference}"`);

      console.log(`[${getTimestamp()}] [Membership] Found existing membership: ${membership.id}`);

      return res.status(200).json({
        success: true,
        message: "Membership verified successfully!",
        data: {
          membership: {
            id: membership.id,
            tier: membership.tier,
            purchase_date: membership.purchase_date,
            status: membership.status,
            amount_paid: membership.amount_paid,
          },
        },
      });
    } catch (notFoundError) {
      // Not in DB yet — verify directly with Paystack
      console.log(`[${getTimestamp()}] [Membership] Membership not in DB yet, checking Paystack...`);

      const paystackResponse = await axios.get(
        `${PAYSTACK_API_BASE}/transaction/verify/${reference}`,
        {
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
        }
      );

      console.log(`[${getTimestamp()}] [Membership] Full transaction:`, JSON.stringify(paystackResponse.data.data, null, 2));

      if (!paystackResponse.data.status) {
        return res.status(400).json({ success: false, message: "Payment verification failed" });
      }

      const transaction = paystackResponse.data.data;

      // Accept both success and pending (mobile money is async)
      const acceptedStatuses = ["success", "pending"];
      if (!acceptedStatuses.includes(transaction.status)) {
        console.log(`[${getTimestamp()}] [Membership] Rejected status: ${transaction.status}`);
        return res.status(400).json({
          success: false,
          message: `Payment not successful (status: ${transaction.status})`,
        });
      }

      // ─── Extract from custom_fields with flat metadata fallback ─────────────
      // Supports both new (custom_fields) and old (flat) metadata formats.
      const customFields = transaction.metadata?.custom_fields || [];
      const getField = (name) =>
        customFields.find((f) => f.variable_name === name)?.value ?? null;

      const userId = getField("userId") || transaction.metadata?.userId || null;
      const tier   = getField("tier")   || transaction.metadata?.tier   || null;

      console.log(`[${getTimestamp()}] [Membership] Extracted — userId: ${userId}, tier: ${tier}`);
      console.log(`[${getTimestamp()}] [Membership] Raw metadata: ${JSON.stringify(transaction.metadata)}`);

      if (!userId || !tier) {
        console.error(`[${getTimestamp()}] [Membership] Missing userId or tier in metadata`);
        return res.status(400).json({
          success: false,
          message: "Invalid transaction metadata: missing userId or tier",
        });
      }

      // Payment confirmed — create membership record now if webhook hasn't yet
      const tierData = MEMBERSHIP_TIERS[tier];

      // Idempotency check before creating
      let membership;
      try {
        membership = await pb
          .collection("user_memberships")
          .getFirstListItem(`user_id="${userId}" && payment_reference="${reference}"`);
        console.log(`[${getTimestamp()}] [Membership] Membership already exists: ${membership.id}`);
      } catch (e) {
        // Not found — create it
        membership = await pb.collection("user_memberships").create({
          user_id: userId,
          tier,
          purchase_date: new Date().toISOString(),
          status: "active",
          payment_reference: reference,
          refund_eligible: true,
          refund_processed: false,
          amount_paid: tierData ? tierData.price : 0,
        });
        console.log(`[${getTimestamp()}] [Membership] Membership created: ${membership.id}`);
      }

      return res.status(200).json({
        success: true,
        message: "Membership activated successfully!",
        data: {
          membership: {
            id: membership.id,
            tier: membership.tier,
            purchase_date: membership.purchase_date,
            status: membership.status,
            amount_paid: membership.amount_paid,
          },
        },
      });
    }
  } catch (error) {
    console.error(`[${getTimestamp()}] [Membership] Verify error:`, error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to verify membership",
      details: error.message,
    });
  }
});

/**
 * POST /membership/webhook
 * Receives Paystack webhook events and activates membership on charge.success.
 */
router.post("/webhook", async (req, res) => {
  console.log(`[${getTimestamp()}] [Membership] Received webhook`);

  try {
    const signature = req.headers["x-paystack-signature"];
    const payload = req.body;

    if (!signature || !verifyPaystackSignature(payload, signature)) {
      console.warn(`[${getTimestamp()}] [Membership] Webhook signature verification failed`);
      return res.status(200).json({ message: "Event received" });
    }

    const event = payload.event;
    console.log(`[${getTimestamp()}] [Membership] Event: ${event}`);

    if (event !== "charge.success") {
      return res.status(200).json({ message: "Event received" });
    }

    const { reference, status, amount, metadata } = payload.data;

    if (status !== "success") {
      return res.status(200).json({ message: "Event received" });
    }

    // ─── Extract from custom_fields with flat metadata fallback ─────────────
    const customFields = metadata?.custom_fields || [];
    const getField = (name) =>
      customFields.find((f) => f.variable_name === name)?.value ?? null;

    const userId = getField("userId") || metadata?.userId || null;
    const tier   = getField("tier")   || metadata?.tier   || null;
    const type   = getField("type")   || metadata?.type   || null;

    // Only process membership webhooks
    if (type !== "membership") {
      console.log(`[${getTimestamp()}] [Membership] Skipping non-membership webhook (type: ${type})`);
      return res.status(200).json({ message: "Event received" });
    }

    if (!userId || !tier) {
      console.error(`[${getTimestamp()}] [Membership] Missing userId or tier in webhook metadata`);
      return res.status(200).json({ message: "Event received" });
    }

    await authenticatePocketBase();

    // Idempotency check
    try {
      const existing = await pb
        .collection("user_memberships")
        .getFirstListItem(`user_id="${userId}" && payment_reference="${reference}"`);
      if (existing) {
        console.log(`[${getTimestamp()}] [Membership] Membership already exists: ${existing.id}`);
        return res.status(200).json({ message: "Event received" });
      }
    } catch (e) {
      // Not found — proceed to create
    }

    const tierData = MEMBERSHIP_TIERS[tier];
    const membership = await pb.collection("user_memberships").create({
      user_id: userId,
      tier,
      purchase_date: new Date().toISOString(),
      status: "active",
      payment_reference: reference,
      refund_eligible: true,
      refund_processed: false,
      amount_paid: tierData ? tierData.price : amount / 100,
    });

    console.log(`[${getTimestamp()}] [Membership] Membership created via webhook: ${membership.id}`);

    // Send confirmation email (non-fatal)
    try {
      const user = await pb.collection("users").getOne(userId);
      if (user.email && tierData) {
        const emailSubject = `Welcome to ${tier} Membership - Velocity Global Leasing`;
        const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .header h2 { margin: 0; }
    .field { margin-bottom: 15px; }
    .field-label { font-weight: bold; color: #2c3e50; margin-bottom: 5px; }
    .field-value { background-color: #f8f9fa; padding: 10px; border-left: 3px solid #3498db; }
    .benefits { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin-top: 20px; }
    .benefits h3 { margin-top: 0; color: #2c3e50; }
    .cta-button { display: inline-block; background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #7f8c8d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h2>Welcome to ${tier} Membership!</h2></div>
    <div class="content">
      <p>Thank you for upgrading to our ${tier} membership. Your account is now active.</p>
      <div class="field">
        <div class="field-label">Membership Tier:</div>
        <div class="field-value">${tier}</div>
      </div>
      <div class="field">
        <div class="field-label">Amount Paid:</div>
        <div class="field-value">$${tierData.price}</div>
      </div>
      <div class="field">
        <div class="field-label">Purchase Date:</div>
        <div class="field-value">${new Date().toLocaleDateString()}</div>
      </div>
      <div class="field">
        <div class="field-label">Refund Deadline:</div>
        <div class="field-value">${new Date(Date.now() + REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
      </div>
      <p style="color: #e74c3c; font-weight: bold;">You have 7 days from purchase to cancel and receive a full refund.</p>
      <div class="benefits">
        <h3>Your ${tier} Membership Includes:</h3>
        <ul>
          <li>Access to exclusive seminars and webinars</li>
          <li>Private Slack community with industry experts</li>
          <li>Weekly industry reports and market analysis</li>
          <li>Special discounts on premium courses</li>
          <li>Priority support from our team</li>
        </ul>
      </div>
      <a href="https://www.velocitygloballeasing.com/dashboard" class="cta-button">Go to Dashboard</a>
    </div>
    <div class="footer">
      <p>This email was sent from Velocity Global Leasing.</p>
      <p>Questions? Contact us at support@velocitygloballeasing.com</p>
    </div>
  </div>
</body>
</html>`.trim();

        await pb.sendSuperuserEmail(user.email, emailSubject, emailBody);
        console.log(`[${getTimestamp()}] [Membership] Confirmation email sent to ${user.email}`);
      }
    } catch (emailErr) {
      console.warn(`[${getTimestamp()}] [Membership] Failed to send confirmation email:`, emailErr.message);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`[${getTimestamp()}] [Membership] Webhook error:`, error.message);
    return res.status(200).json({ message: "Event received" });
  }
});

/**
 * GET /membership/status
 */
// router.get("/status", async (req, res) => {
//   console.log(`[${getTimestamp()}] [Membership] Received status request`);
//   try {
//     const { userId } = req.query;
//     if (!userId) {
//       return res.status(400).json({ error: "Missing userId parameter" });
//     }

//     await authenticatePocketBase();

//     try {
//       const membership = await pb
//         .collection("user_memberships")
//         .getFirstListItem(`user_id="${userId}" && status="active"`, {
//           sort: "-purchase_date",
//         });

//       const refundInfo = calculateRefundEligibility(membership.purchase_date);

//       return res.status(200).json({
//         hasMembership: true,
//         tier: membership.tier,
//         purchase_date: membership.purchase_date,
//         status: membership.status,
//         refund_eligible: refundInfo.eligible,
//         days_remaining: refundInfo.daysRemaining,
//       });
//     } catch (e) {
//       return res.status(200).json({ hasMembership: false });
//     }
//   } catch (error) {
//     console.error(`[${getTimestamp()}] [Membership] Status error:`, error.message);
//     return res.status(500).json({ error: "Failed to fetch membership status" });
//   }
// });

/**
 * GET /membership/status
 * Returns the current user's active membership, or { hasMembership: false }.
 */
router.get("/status", async (req, res) => {
  console.log(`[${getTimestamp()}] [Membership] Received status request`);
  
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter" });
    }

    await authenticatePocketBase();

    try {
      // Correct filter syntax - use single quotes around string values
      const result = await pb
        .collection("user_memberships")
        .getList(1, 1, {
          filter: `user_id = '${userId}'`,
          sort: "-purchase_date",
        });
      
      console.log(`[${getTimestamp()}] [Membership] Found ${result.items.length} membership(s)`);
      
      if (result.items.length > 0) {
        const membership = result.items[0];
        
        const refundInfo = calculateRefundEligibility(membership.purchase_date);
        
        return res.status(200).json({
          hasMembership: true,
          tier: membership.tier,
          purchase_date: membership.purchase_date,
          status: membership.status,
          refund_eligible: refundInfo.eligible,
          days_remaining: refundInfo.daysRemaining,
        });
      } else {
        return res.status(200).json({ hasMembership: false });
      }
      
    } catch (e) {
      console.error(`[${getTimestamp()}] [Membership] Query error:`, e.message);
      return res.status(200).json({ hasMembership: false });
    }
  } catch (error) {
    console.error(`[${getTimestamp()}] [Membership] Status error:`, error.message);
    return res.status(500).json({ error: "Failed to fetch membership status" });
  }
});

/**
 * GET /membership/refund-eligible
 */
router.get("/refund-eligible", async (req, res) => {
  console.log(`[${getTimestamp()}] [Membership] Received refund-eligible request`);
  try {
    const { userId } = req.query;
    console.log("UserId",userId)
    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter" });
    }

    await authenticatePocketBase();

    try {
      const membership = await pb
        .collection("user_memberships")
        .getFirstListItem(`user_id="${userId}" && status="active"`, {
          sort: "-purchase_date",
        });

      const refundInfo = calculateRefundEligibility(membership.purchase_date);
      const tierData = MEMBERSHIP_TIERS[membership.tier];

      return res.status(200).json({
        eligible: refundInfo.eligible,
        days_remaining: refundInfo.daysRemaining,
        refund_amount: refundInfo.eligible && tierData ? tierData.price : 0,
        tier: membership.tier,
      });
    } catch (e) {
      return res.status(200).json({ eligible: false, days_remaining: 0, refund_amount: 0, tier: null });
    }
  } catch (error) {
    console.error(`[${getTimestamp()}] [Membership] Refund-eligible error:`, error.message);
    return res.status(500).json({ error: "Failed to check refund eligibility" });
  }
});

/**
 * POST /membership/cancel
 */
router.post("/cancel", async (req, res) => {
  console.log(`[${getTimestamp()}] [Membership] Received cancel request`);
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter" });
    }

    await authenticatePocketBase();

    let membership;
    try {
      membership = await pb
        .collection("user_memberships")
        .getFirstListItem(`user_id="${userId}" && status="active"`, {
          sort: "-purchase_date",
        });
    } catch (e) {
      return res.status(400).json({ error: "No active membership found" });
    }

    const refundInfo = calculateRefundEligibility(membership.purchase_date);
    const tierData = MEMBERSHIP_TIERS[membership.tier];
    const refundAmount = refundInfo.eligible && tierData ? tierData.price : 0;
    let refundProcessed = false;

    if (refundInfo.eligible && tierData) {
      console.log(`[${getTimestamp()}] [Membership] Processing refund for: ${membership.payment_reference}`);
      try {
        const refundResponse = await axios.post(
          `${PAYSTACK_API_BASE}/refund`,
          {
            transaction: membership.payment_reference,
            amount: tierData.amount_kobo,
          },
          {
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (refundResponse.data.status) {
          refundProcessed = true;
          console.log(`[${getTimestamp()}] [Membership] Refund processed successfully`);
        } else {
          console.error(`[${getTimestamp()}] [Membership] Refund API error:`, refundResponse.data.message);
        }
      } catch (refundErr) {
        console.error(`[${getTimestamp()}] [Membership] Refund request failed:`, refundErr.message);
      }
    }

    await pb.collection("user_memberships").update(membership.id, {
      status: "cancelled",
      cancellation_date: new Date().toISOString(),
      refund_eligible: refundInfo.eligible,
      refund_processed: refundProcessed,
    });

    console.log(`[${getTimestamp()}] [Membership] Membership ${membership.id} cancelled`);

    // Send cancellation email (non-fatal)
    try {
      const user = await pb.collection("users").getOne(userId);
      if (user.email) {
        const refundMessage = refundProcessed
          ? `<p>A refund of <strong>$${refundAmount}</strong> has been processed. Please allow 5–7 business days.</p>`
          : `<p>Your membership has been cancelled. The 7-day refund window has expired, so no refund will be issued.</p>`;

        const emailBody = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #e74c3c; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
      <h2 style="margin: 0;">Membership Cancelled</h2>
    </div>
    ${refundMessage}
    <p><strong>Tier:</strong> ${membership.tier}</p>
    <p><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</p>
    ${refundProcessed ? `<p><strong>Refund Amount:</strong> $${refundAmount}</p>` : ""}
    <p>We'd love to have you back! Contact us at support@velocitygloballeasing.com</p>
  </div>
</body>
</html>`.trim();

        await pb.sendSuperuserEmail(
          user.email,
          "Membership Cancelled - Velocity Global Leasing",
          emailBody
        );
        console.log(`[${getTimestamp()}] [Membership] Cancellation email sent to ${user.email}`);
      }
    } catch (emailErr) {
      console.warn(`[${getTimestamp()}] [Membership] Failed to send cancellation email:`, emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: refundProcessed
        ? "Membership cancelled. Refund processed."
        : "Membership cancelled. Refund period expired.",
      refund_amount: refundAmount,
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] [Membership] Cancel error:`, error.message);
    return res.status(500).json({ error: "Failed to cancel membership", details: error.message });
  }
});

export default router;