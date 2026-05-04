// import express from "express";
// import axios from "axios";
// import crypto from "crypto";
// import PocketBase from "pocketbase";

// const router = express.Router();
// const POCKETBASE_URL = "https://velocity-global-db-v2.onrender.com";
// const pb = new PocketBase(POCKETBASE_URL);
// pb.autoCancellation(false);

// const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
// const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;
// const PAYSTACK_API_BASE = "https://api.paystack.co";
// const FRONTEND_URL =
//   process.env.FRONTEND_URL || "https://www.velocitygloballeasing.com";

// const getTimestamp = () => new Date().toISOString();

// const PROMO_CODES = {
//   LAK26: {
//     type: "percent",
//     value: 100,
//     message: "100% discount applied — enjoy free access!",
//   },
// };

// // Helper to authenticate as admin/superuser
// const authenticatePocketBase = async () => {
//   try {
//     if (!pb.authStore.isValid) {
//       console.log(`[${getTimestamp()}] [Paystack] Authenticating as user...`);
//       await pb
//         .collection("users")
//         .authWithPassword(
//           process.env.POCKETBASE_ADMIN_EMAIL,
//           process.env.POCKETBASE_ADMIN_PASSWORD,
//         );
//       console.log(`[${getTimestamp()}] [Paystack] Authentication successful`);
//     }
//   } catch (error) {
//     console.error(
//       `[${getTimestamp()}] [Paystack] PocketBase authentication failed:`,
//       error.message,
//     );
//     throw new Error("Database authentication failed: " + error.message);
//   }
// };

// /**
//  * POST /paystack/validate-promo
//  * Validates a promo code and returns discount info
//  */
// router.post("/validate-promo", (req, res) => {
//   const { code, amount } = req.body;

//   if (!code)
//     return res.status(400).json({ valid: false, message: "No code provided." });

//   const promo = PROMO_CODES[code.toUpperCase()];

//   if (!promo) {
//     return res
//       .status(400)
//       .json({ valid: false, message: "Invalid promo code." });
//   }

//   const subtotal = parseFloat(amount) || 0;
//   let discount = 0;
//   let finalAmount = subtotal;

//   if (promo.type === "percent") {
//     discount = parseFloat(((promo.value / 100) * subtotal).toFixed(2));
//     finalAmount = parseFloat((subtotal - discount).toFixed(2));
//   } else if (promo.type === "free") {
//     discount = subtotal;
//     finalAmount = 0;
//   }

//   return res.status(200).json({
//     valid: true,
//     code: code.toUpperCase(),
//     type: promo.type,
//     value: promo.value,
//     discount,
//     finalAmount,
//     message: promo.message,
//   });
// });

// /**
//  * POST /paystack/initialize
//  * Initializes a Paystack transaction for course(s) purchase
//  */
// router.post("/initialize", async (req, res) => {
//   console.log(`[${getTimestamp()}] [Paystack] Received initialize request`);

//   try {
//     const { courseId, cartItems, userId, userEmail, amount, promoCode } =
//       req.body;

//     let finalAmount = parseFloat(amount);
//     if (promoCode) {
//       const promo = PROMO_CODES[promoCode.toUpperCase()];
//       if (promo) {
//         if (promo.type === "percent") {
//           finalAmount = parseFloat(
//             (amount * (1 - promo.value / 100)).toFixed(2),
//           );
//         } else if (promo.type === "free") {
//           finalAmount = 0;
//         }
//         console.log(
//           `[${getTimestamp()}] [Paystack] Promo "${promoCode}" applied. Original: $${amount}, Final: $${finalAmount}`,
//         );
//       }
//     }

//     // Validation
//     if (!userId) {
//       console.warn(
//         `[${getTimestamp()}] [Paystack] Validation failed: Missing userId`,
//       );
//       return res.status(400).json({ error: "Missing userId" });
//     }

//     if (!userEmail) {
//       console.warn(
//         `[${getTimestamp()}] [Paystack] Validation failed: Missing userEmail`,
//       );
//       return res.status(400).json({ error: "Missing userEmail" });
//     }

//     if (!amount || amount <= 0) {
//       console.warn(
//         `[${getTimestamp()}] [Paystack] Validation failed: Invalid amount`,
//       );
//       return res.status(400).json({ error: "Invalid amount" });
//     }

//     // Determine courses to purchase
//     const coursesToPurchase =
//       cartItems && Array.isArray(cartItems) && cartItems.length > 0
//         ? cartItems
//         : courseId
//           ? [courseId]
//           : [];

//     if (coursesToPurchase.length === 0) {
//       console.warn(
//         `[${getTimestamp()}] [Paystack] Validation failed: No courses specified`,
//       );
//       return res.status(400).json({ error: "Missing courseId or cartItems" });
//     }

//     console.log(
//       `[${getTimestamp()}] [Paystack] Initializing for ${coursesToPurchase.length} course(s), User: ${userId}, Amount: $${amount} USD`,
//     );

//     // Convert USD → KES → kobo (Paystack smallest unit)
//     const USD_TO_KES_RATE = 129;
//     // const amountInKes = amount * USD_TO_KES_RATE;
//     const amountInKes = finalAmount * USD_TO_KES_RATE;
//     const amountInKobo = Math.round(amountInKes * 100);

//     console.log(
//       `[${getTimestamp()}] [Paystack] USD: ${amount} → KES: ${amountInKes} (rate: ${USD_TO_KES_RATE}) → kobo: ${amountInKobo}`,
//     );

//     // Use custom_fields so Paystack reliably returns the data on verify
//     const metadata = {
//       cancel_action: `${FRONTEND_URL}/cancel`,
//       custom_fields: [
//         {
//           display_name: "User ID",
//           variable_name: "userId",
//           value: userId,
//         },
//         {
//           display_name: "Course ID",
//           variable_name: "courseId",
//           value: courseId || "",
//         },
//         {
//           display_name: "Cart Items",
//           variable_name: "cartItems",
//           // Stringify the array — we parse it back in /verify
//           value: JSON.stringify(coursesToPurchase),
//         },
//         {
//           display_name: "USD Amount",
//           variable_name: "usdAmount",
//           value: String(amount),
//         },
//       ],
//     };

//     console.log(
//       `[${getTimestamp()}] [Paystack] Metadata:`,
//       JSON.stringify(metadata),
//     );

//     // Call Paystack API
//     console.log(
//       `[${getTimestamp()}] [Paystack] Calling Paystack initialize API...`,
//     );
//     const response = await axios.post(
//       `${PAYSTACK_API_BASE}/transaction/initialize`,
//       {
//         email: userEmail,
//         amount: amountInKobo,
//         metadata,
//         callback_url: `${FRONTEND_URL}/success`,
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
//         `[${getTimestamp()}] [Paystack] API returned error: ${response.data.message}`,
//       );
//       return res.status(400).json({ error: response.data.message });
//     }

//     const { authorization_url, reference } = response.data.data;
//     console.log(
//       `[${getTimestamp()}] [Paystack] Transaction initialized. Reference: ${reference}`,
//     );

//     return res.status(200).json({ authorization_url, reference });
//   } catch (error) {
//     console.error(
//       `[${getTimestamp()}] [Paystack] Initialize error: ${error.message}`,
//     );

//     if (error.response?.data) {
//       console.error(
//         `[${getTimestamp()}] [Paystack] API error details:`,
//         error.response.data,
//       );
//     }

//     if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
//       return res.status(503).json({
//         error: "Paystack service unavailable",
//         details: error.message,
//       });
//     }

//     return res.status(500).json({
//       error: "Failed to initialize transaction",
//       details: error.message,
//     });
//   }
// });

// /**
//  * POST /paystack/verify
//  * Verifies a Paystack transaction and creates enrollment records
//  */
// router.post("/verify", async (req, res) => {
//   console.log(`[${getTimestamp()}] [Paystack] Received verify request`);

//   try {
//     const { reference } = req.body;

//     if (!reference) {
//       console.warn(
//         `[${getTimestamp()}] [Paystack] Validation failed: Missing reference`,
//       );
//       return res.status(400).json({ error: "Missing reference" });
//     }

//     console.log(
//       `[${getTimestamp()}] [Paystack] Verifying transaction: ${reference}`,
//     );

//     // Call Paystack verify API
//     const response = await axios.get(
//       `${PAYSTACK_API_BASE}/transaction/verify/${reference}`,
//       {
//         headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
//       },
//     );

//     if (!response.data.status) {
//       console.error(
//         `[${getTimestamp()}] [Paystack] Verification failed: ${response.data.message}`,
//       );
//       return res
//         .status(400)
//         .json({ success: false, message: "Payment verification failed" });
//     }

//     const transaction = response.data.data;

//     // Log full transaction so we can debug metadata shape if needed
//     console.log(
//       `[${getTimestamp()}] [Paystack] Full transaction:`,
//       JSON.stringify(transaction, null, 2),
//     );

//     if (transaction.status !== "success") {
//       console.log(
//         `[${getTimestamp()}] [Paystack] Transaction status: ${transaction.status}`,
//       );
//       return res
//         .status(400)
//         .json({ success: false, message: "Payment not successful" });
//     }

//     console.log(
//       `[${getTimestamp()}] [Paystack] Transaction verified. Reference: ${reference}`,
//     );

//     // ─── Extract metadata from custom_fields ───────────────────────────────
//     const customFields = transaction.metadata?.custom_fields || [];

//     const getField = (variableName) =>
//       customFields.find((f) => f.variable_name === variableName)?.value ?? null;

//     const userId = getField("userId");
//     const courseId = getField("courseId");
//     const cartItemsRaw = getField("cartItems");

//     console.log(
//       `[${getTimestamp()}] [Paystack] Extracted — userId: ${userId}, courseId: ${courseId}, cartItems: ${cartItemsRaw}`,
//     );

//     if (!userId) {
//       console.error(
//         `[${getTimestamp()}] [Paystack] Missing userId in metadata`,
//       );
//       return res
//         .status(400)
//         .json({
//           success: false,
//           message: "Invalid transaction metadata: missing userId",
//         });
//     }

//     // Parse cartItems — it was JSON.stringify'd on initialize
//     let coursesToEnroll = [];
//     try {
//       const parsed = cartItemsRaw ? JSON.parse(cartItemsRaw) : [];
//       coursesToEnroll =
//         Array.isArray(parsed) && parsed.length > 0
//           ? parsed
//           : courseId
//             ? [courseId]
//             : [];
//     } catch (parseErr) {
//       console.warn(
//         `[${getTimestamp()}] [Paystack] Could not parse cartItems, falling back to courseId`,
//       );
//       coursesToEnroll = courseId ? [courseId] : [];
//     }

//     if (coursesToEnroll.length === 0) {
//       console.error(
//         `[${getTimestamp()}] [Paystack] No courses found in metadata`,
//       );
//       return res
//         .status(400)
//         .json({ success: false, message: "No courses to enroll" });
//     }

//     console.log(
//       `[${getTimestamp()}] [Paystack] Enrolling in ${coursesToEnroll.length} course(s):`,
//       coursesToEnroll,
//     );

//     // Authenticate with PocketBase
//     await authenticatePocketBase();

//     // Create enrollment records
//     const enrollments = [];
//     const enrollmentErrors = [];

//     for (const cId of coursesToEnroll) {
//       try {
//         console.log(
//           `[${getTimestamp()}] [Paystack] Processing enrollment — user: ${userId}, course: ${cId}`,
//         );

//         // Check for existing enrollment to avoid duplicates
//         try {
//           const existing = await pb
//             .collection("enrollment")
//             .getFirstListItem(`user_id="${userId}" && course_id="${cId}"`);
//           if (existing) {
//             console.log(
//               `[${getTimestamp()}] [Paystack] Enrollment already exists: ${existing.id}`,
//             );
//             enrollments.push({
//               courseId: cId,
//               userId,
//               enrollmentId: existing.id,
//               status: "existing",
//             });
//             continue;
//           }
//         } catch (e) {
//           // 404 = not found, safe to create
//         }

//         const enrollment = await pb.collection("enrollment").create({
//           user_id: userId,
//           course_id: cId,
//           enrollment_date: new Date().toISOString(),
//           status: "active",
//           stripe_session_id: reference, // reusing this field for Paystack reference
//         });

//         console.log(
//           `[${getTimestamp()}] [Paystack] Enrollment created: ${enrollment.id}`,
//         );
//         enrollments.push({
//           courseId: cId,
//           userId,
//           enrollmentId: enrollment.id,
//           status: "new",
//         });
//       } catch (enrollmentErr) {
//         console.error(
//           `[${getTimestamp()}] [Paystack] Failed to enroll in course ${cId}: ${enrollmentErr.message}`,
//         );
//         enrollmentErrors.push({ courseId: cId, error: enrollmentErr.message });
//       }
//     }

//     if (enrollments.length > 0) {
//       console.log(
//         `[${getTimestamp()}] [Paystack] Successfully processed ${enrollments.length} enrollment(s)`,
//       );
//       return res.status(200).json({
//         success: true,
//         enrollments,
//         errors: enrollmentErrors.length > 0 ? enrollmentErrors : undefined,
//       });
//     } else {
//       console.error(
//         `[${getTimestamp()}] [Paystack] Failed to create any enrollments`,
//       );
//       return res.status(500).json({
//         success: false,
//         message: "Failed to create enrollments",
//         errors: enrollmentErrors,
//       });
//     }
//   } catch (error) {
//     console.error(
//       `[${getTimestamp()}] [Paystack] Verify error: ${error.message}`,
//     );

//     if (error.response?.data) {
//       console.error(
//         `[${getTimestamp()}] [Paystack] API error details:`,
//         error.response.data,
//       );
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Failed to verify transaction",
//       details: error.message,
//     });
//   }
// });

// export default router;

// // import express from 'express';
// // import axios from 'axios';
// // import crypto from 'crypto';
// // import PocketBase from 'pocketbase';

// // const router = express.Router();
// // const POCKETBASE_URL = 'https://velocity-global-db-v2.onrender.com';
// // const pb = new PocketBase(POCKETBASE_URL);
// // pb.autoCancellation(false);

// // const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
// // const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;
// // const PAYSTACK_API_BASE = 'https://api.paystack.co';
// // const FRONTEND_URL = process.env.FRONTEND_URL || 'https://velocitygloballeasing.com';

// // const getTimestamp = () => new Date().toISOString();

// // // Helper to authenticate as admin/superuser
// // const authenticatePocketBase = async () => {
// //   try {
// //     if (!pb.authStore.isValid) {
// //       console.log(`[${getTimestamp()}] [Paystack] Authenticating as user...`);
// //       await pb.collection('users').authWithPassword(
// //         process.env.POCKETBASE_ADMIN_EMAIL,
// //         process.env.POCKETBASE_ADMIN_PASSWORD
// //       );
// //       console.log(`[${getTimestamp()}] [Paystack] Authentication successful`);
// //     }
// //   } catch (error) {
// //     console.error(`[${getTimestamp()}] [Paystack] PocketBase authentication failed:`, error.message);
// //     throw new Error('Database authentication failed: ' + error.message);
// //   }
// // };

// // /**
// //  * POST /paystack/initialize
// //  * Initializes a Paystack transaction for course(s) purchase
// //  */
// // router.post('/initialize', async (req, res) => {
// //   console.log(`[${getTimestamp()}] [Paystack] Received initialize request`);
// //   console.log(req.body)

// //   try {
// //     const { courseId, cartItems, userId, userEmail, amount } = req.body;

// //     console.log('FULL BODY:', req.body);
// //     console.log('EMAIL RECEIVED:', req.body.userEmail);

// //     // Validation
// //     if (!userId) {
// //       console.warn(`[${getTimestamp()}] [Paystack] Validation failed: Missing userId`);
// //       return res.status(400).json({ error: 'Missing userId' });
// //     }

// //     if (!userEmail) {
// //       console.warn(`[${getTimestamp()}] [Paystack] Validation failed: Missing userEmail`);
// //       return res.status(400).json({ error: 'Missing userEmail' });
// //     }

// //     if (!amount || amount <= 0) {
// //       console.warn(`[${getTimestamp()}] [Paystack] Validation failed: Invalid amount`);
// //       return res.status(400).json({ error: 'Invalid amount' });
// //     }

// //     // Determine courses to purchase
// //     const coursesToPurchase =
// //       cartItems && Array.isArray(cartItems) && cartItems.length > 0
// //         ? cartItems
// //         : courseId
// //         ? [courseId]
// //         : [];

// //     if (coursesToPurchase.length === 0) {
// //       console.warn(`[${getTimestamp()}] [Paystack] Validation failed: No courses specified`);
// //       return res.status(400).json({ error: 'Missing courseId or cartItems' });
// //     }

// //     console.log(
// //       `[${getTimestamp()}] [Paystack] Initializing for ${coursesToPurchase.length} course(s), User: ${userId}, Amount: $${amount} USD`
// //     );

// //     // Convert USD → KES → kobo (Paystack smallest unit)
// //     const USD_TO_KES_RATE = 129;
// //     const amountInKes = amount * USD_TO_KES_RATE;
// //     const amountInKobo = Math.round(amountInKes * 100);

// //     console.log(
// //       `[${getTimestamp()}] [Paystack] USD: ${amount} → KES: ${amountInKes} (rate: ${USD_TO_KES_RATE}) → kobo: ${amountInKobo}`
// //     );

// //     // Use custom_fields so Paystack reliably returns the data on verify
// //     const metadata = {
// //       cancel_action: `${FRONTEND_URL}/cancel`,
// //       custom_fields: [
// //         {
// //           display_name: 'User ID',
// //           variable_name: 'userId',
// //           value: userId,
// //         },
// //         {
// //           display_name: 'Course ID',
// //           variable_name: 'courseId',
// //           value: courseId || '',
// //         },
// //         {
// //           display_name: 'Cart Items',
// //           variable_name: 'cartItems',
// //           // Stringify the array — we parse it back in /verify
// //           value: JSON.stringify(coursesToPurchase),
// //         },
// //         {
// //           display_name: 'USD Amount',
// //           variable_name: 'usdAmount',
// //           value: String(amount),
// //         },
// //       ],
// //     };

// //     console.log(`[${getTimestamp()}] [Paystack] Metadata:`, JSON.stringify(metadata));

// //     // Call Paystack API
// //     console.log(`[${getTimestamp()}] [Paystack] Calling Paystack initialize API...`);
// //     const response = await axios.post(
// //       `${PAYSTACK_API_BASE}/transaction/initialize`,
// //       {
// //         email: userEmail,
// //         amount: amountInKobo,
// //         metadata,
// //       },
// //       {
// //         headers: {
// //           Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
// //           'Content-Type': 'application/json',
// //         },
// //       }
// //     );

// //     if (!response.data.status) {
// //       console.error(`[${getTimestamp()}] [Paystack] API returned error: ${response.data.message}`);
// //       return res.status(400).json({ error: response.data.message });
// //     }

// //     const { authorization_url, reference } = response.data.data;
// //     console.log(`[${getTimestamp()}] [Paystack] Transaction initialized. Reference: ${reference}`);

// //     return res.status(200).json({ authorization_url, reference });

// //   } catch (error) {
// //     console.error(`[${getTimestamp()}] [Paystack] Initialize error: ${error.message}`);

// //     if (error.response?.data) {
// //       console.error(`[${getTimestamp()}] [Paystack] API error details:`, error.response.data);
// //     }

// //     if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
// //       return res.status(503).json({
// //         error: 'Paystack service unavailable',
// //         details: error.message,
// //       });
// //     }

// //     return res.status(500).json({
// //       error: 'Failed to initialize transaction',
// //       details: error.message,
// //     });
// //   }
// // });

// // /**
// //  * POST /paystack/verify
// //  * Verifies a Paystack transaction and creates enrollment records
// //  */
// // router.post('/verify', async (req, res) => {
// //   console.log(`[${getTimestamp()}] [Paystack] Received verify request`);

// //   try {
// //     const { reference } = req.body;

// //     if (!reference) {
// //       console.warn(`[${getTimestamp()}] [Paystack] Validation failed: Missing reference`);
// //       return res.status(400).json({ error: 'Missing reference' });
// //     }

// //     console.log(`[${getTimestamp()}] [Paystack] Verifying transaction: ${reference}`);

// //     // Call Paystack verify API
// //     const response = await axios.get(
// //       `${PAYSTACK_API_BASE}/transaction/verify/${reference}`,
// //       {
// //         headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
// //       }
// //     );

// //     if (!response.data.status) {
// //       console.error(`[${getTimestamp()}] [Paystack] Verification failed: ${response.data.message}`);
// //       return res.status(400).json({ success: false, message: 'Payment verification failed' });
// //     }

// //     const transaction = response.data.data;

// //     // Log full transaction so we can debug metadata shape if needed
// //     console.log(`[${getTimestamp()}] [Paystack] Full transaction:`, JSON.stringify(transaction, null, 2));

// //     if (transaction.status !== 'success') {
// //       console.log(`[${getTimestamp()}] [Paystack] Transaction status: ${transaction.status}`);
// //       return res.status(400).json({ success: false, message: 'Payment not successful' });
// //     }

// //     console.log(`[${getTimestamp()}] [Paystack] Transaction verified. Reference: ${reference}`);

// //     // ─── Extract metadata from custom_fields ───────────────────────────────
// //     const customFields = transaction.metadata?.custom_fields || [];

// //     const getField = (variableName) =>
// //       customFields.find((f) => f.variable_name === variableName)?.value ?? null;

// //     const userId   = getField('userId');
// //     const courseId = getField('courseId');
// //     const cartItemsRaw = getField('cartItems');

// //     console.log(`[${getTimestamp()}] [Paystack] Extracted — userId: ${userId}, courseId: ${courseId}, cartItems: ${cartItemsRaw}`);

// //     if (!userId) {
// //       console.error(`[${getTimestamp()}] [Paystack] Missing userId in metadata`);
// //       return res.status(400).json({ success: false, message: 'Invalid transaction metadata: missing userId' });
// //     }

// //     // Parse cartItems — it was JSON.stringify'd on initialize
// //     let coursesToEnroll = [];
// //     try {
// //       const parsed = cartItemsRaw ? JSON.parse(cartItemsRaw) : [];
// //       coursesToEnroll = Array.isArray(parsed) && parsed.length > 0
// //         ? parsed
// //         : courseId
// //         ? [courseId]
// //         : [];
// //     } catch (parseErr) {
// //       console.warn(`[${getTimestamp()}] [Paystack] Could not parse cartItems, falling back to courseId`);
// //       coursesToEnroll = courseId ? [courseId] : [];
// //     }

// //     if (coursesToEnroll.length === 0) {
// //       console.error(`[${getTimestamp()}] [Paystack] No courses found in metadata`);
// //       return res.status(400).json({ success: false, message: 'No courses to enroll' });
// //     }

// //     console.log(`[${getTimestamp()}] [Paystack] Enrolling in ${coursesToEnroll.length} course(s):`, coursesToEnroll);

// //     // Authenticate with PocketBase
// //     await authenticatePocketBase();

// //     // Create enrollment records
// //     const enrollments = [];
// //     const enrollmentErrors = [];

// //     for (const cId of coursesToEnroll) {
// //       try {
// //         console.log(`[${getTimestamp()}] [Paystack] Processing enrollment — user: ${userId}, course: ${cId}`);

// //         // Check for existing enrollment to avoid duplicates
// //         try {
// //           const existing = await pb.collection('enrollment').getFirstListItem(
// //             `user_id="${userId}" && course_id="${cId}"`
// //           );
// //           if (existing) {
// //             console.log(`[${getTimestamp()}] [Paystack] Enrollment already exists: ${existing.id}`);
// //             enrollments.push({ courseId: cId, userId, enrollmentId: existing.id, status: 'existing' });
// //             continue;
// //           }
// //         } catch (e) {
// //           // 404 = not found, safe to create
// //         }

// //         const enrollment = await pb.collection('enrollment').create({
// //           user_id: userId,
// //           course_id: cId,
// //           enrollment_date: new Date().toISOString(),
// //           status: 'active',
// //           stripe_session_id: reference, // reusing this field for Paystack reference
// //         });

// //         console.log(`[${getTimestamp()}] [Paystack] Enrollment created: ${enrollment.id}`);
// //         enrollments.push({ courseId: cId, userId, enrollmentId: enrollment.id, status: 'new' });

// //       } catch (enrollmentErr) {
// //         console.error(
// //           `[${getTimestamp()}] [Paystack] Failed to enroll in course ${cId}: ${enrollmentErr.message}`
// //         );
// //         enrollmentErrors.push({ courseId: cId, error: enrollmentErr.message });
// //       }
// //     }

// //     if (enrollments.length > 0) {
// //       console.log(`[${getTimestamp()}] [Paystack] Successfully processed ${enrollments.length} enrollment(s)`);
// //       return res.status(200).json({
// //         success: true,
// //         enrollments,
// //         errors: enrollmentErrors.length > 0 ? enrollmentErrors : undefined,
// //       });
// //     } else {
// //       console.error(`[${getTimestamp()}] [Paystack] Failed to create any enrollments`);
// //       return res.status(500).json({
// //         success: false,
// //         message: 'Failed to create enrollments',
// //         errors: enrollmentErrors,
// //       });
// //     }

// //   } catch (error) {
// //     console.error(`[${getTimestamp()}] [Paystack] Verify error: ${error.message}`);

// //     if (error.response?.data) {
// //       console.error(`[${getTimestamp()}] [Paystack] API error details:`, error.response.data);
// //     }

// //     return res.status(500).json({
// //       success: false,
// //       message: 'Failed to verify transaction',
// //       details: error.message,
// //     });
// //   }
// // });

// // export default router;

import express from "express";
import axios from "axios";
import crypto from "crypto";
import PocketBase from "pocketbase";

const router = express.Router();
const POCKETBASE_URL = "https://velocity-global-db-v2.onrender.com";
const pb = new PocketBase(POCKETBASE_URL);
pb.autoCancellation(false);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;
const PAYSTACK_API_BASE = "https://api.paystack.co";
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://www.velocitygloballeasing.com";

const getTimestamp = () => new Date().toISOString();

// ─── Promo Code Config ────────────────────────────────────────────────────────
// Add, edit, or remove codes here at any time.
//
// type: 'percent' → value is the % off  (e.g. value: 20 = 20% off)
// type: 'free'    → user pays nothing, enrolled immediately without Paystack
//
// Set value: 100 on a 'percent' code to also make it fully free.
// ─────────────────────────────────────────────────────────────────────────────
const PROMO_CODES = {
  LAK26: { type: "percent", value: 0, message: "Enjoy the course!" },
  LAKTEST:  { type: 'percent', value: 100, message: 'Free Test Course', courseIds: ['80rp49xsa747m8s'] },
  // Examples — uncomment or copy to add more:
  // SAVE20: { type: 'percent', value: 20,  message: '20% discount applied!' },
  // VIP50:  { type: 'percent', value: 50,  message: '50% off applied!' },
  // FRIEND: { type: 'free',                message: 'Free access granted!' },
};

// ─── Helper: apply a promo code to an amount ──────────────────────────────────
// const applyPromo = (code, amount) => {
//   if (!code) return { discount: 0, finalAmount: amount };
//   const promo = PROMO_CODES[code.toUpperCase()];
//   if (!promo) return { discount: 0, finalAmount: amount };

//   const subtotal = parseFloat(amount) || 0;

//   if (promo.type === 'percent') {
//     const discount = parseFloat(((promo.value / 100) * subtotal).toFixed(2));
//     return { discount, finalAmount: parseFloat((subtotal - discount).toFixed(2)) };
//   }

//   if (promo.type === 'free') {
//     return { discount: subtotal, finalAmount: 0 };
//   }

//   return { discount: 0, finalAmount: amount };
// };

const applyPromo = (code, amount, coursesToPurchase = []) => {
  if (!code) return { discount: 0, finalAmount: amount, valid: true };
  const promo = PROMO_CODES[code.toUpperCase()];
  if (!promo)
    return {
      discount: 0,
      finalAmount: amount,
      valid: false,
      message: "Invalid promo code.",
    };

  // If promo is restricted to specific courses, check ALL items in cart
  if (promo.courseIds && promo.courseIds.length > 0) {
    const allCoursesQualify = coursesToPurchase.every((id) =>
      promo.courseIds.includes(id),
    );
    if (!allCoursesQualify) {
      return {
        discount: 0,
        finalAmount: amount,
        valid: false,
        message:
          "This promo code is not valid for one or more courses in your cart.",
      };
    }
  }

  const subtotal = parseFloat(amount) || 0;

  if (promo.type === "percent") {
    const discount = parseFloat(((promo.value / 100) * subtotal).toFixed(2));
    return {
      discount,
      finalAmount: parseFloat((subtotal - discount).toFixed(2)),
      valid: true,
    };
  }
  if (promo.type === "free") {
    return { discount: subtotal, finalAmount: 0, valid: true };
  }

  return { discount: 0, finalAmount: amount, valid: true };
};

// ─── Helper: authenticate with PocketBase ────────────────────────────────────
const authenticatePocketBase = async () => {
  try {
    if (!pb.authStore.isValid) {
      console.log(
        `[${getTimestamp()}] [Paystack] Authenticating with PocketBase...`,
      );
      await pb
        .collection("users")
        .authWithPassword(
          process.env.POCKETBASE_ADMIN_EMAIL,
          process.env.POCKETBASE_ADMIN_PASSWORD,
        );
      console.log(
        `[${getTimestamp()}] [Paystack] PocketBase authentication successful`,
      );
    }
  } catch (error) {
    console.error(
      `[${getTimestamp()}] [Paystack] PocketBase authentication failed:`,
      error.message,
    );
    throw new Error("Database authentication failed: " + error.message);
  }
};

// ─── Helper: create enrollment records ───────────────────────────────────────
const createEnrollments = async (coursesToEnroll, userId, reference) => {
  const enrollments = [];
  const enrollmentErrors = [];

  for (const cId of coursesToEnroll) {
    try {
      console.log(
        `[${getTimestamp()}] [Paystack] Processing enrollment — user: ${userId}, course: ${cId}`,
      );

      // Check for existing enrollment to avoid duplicates
      try {
        const existing = await pb
          .collection("enrollment")
          .getFirstListItem(`user_id="${userId}" && course_id="${cId}"`);
        if (existing) {
          console.log(
            `[${getTimestamp()}] [Paystack] Enrollment already exists: ${existing.id}`,
          );
          enrollments.push({
            courseId: cId,
            userId,
            enrollmentId: existing.id,
            status: "existing",
          });
          continue;
        }
      } catch (e) {
        // 404 = not found, safe to create
      }

      const enrollment = await pb.collection("enrollment").create({
        user_id: userId,
        course_id: cId,
        enrollment_date: new Date().toISOString(),
        status: "active",
        stripe_session_id: reference,
      });

      console.log(
        `[${getTimestamp()}] [Paystack] Enrollment created: ${enrollment.id}`,
      );
      enrollments.push({
        courseId: cId,
        userId,
        enrollmentId: enrollment.id,
        status: "new",
      });
    } catch (enrollmentErr) {
      console.error(
        `[${getTimestamp()}] [Paystack] Failed to enroll in course ${cId}: ${enrollmentErr.message}`,
      );
      enrollmentErrors.push({ courseId: cId, error: enrollmentErr.message });
    }
  }

  return { enrollments, enrollmentErrors };
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /paystack/validate-promo
// Called by the frontend to check a promo code before checkout.
// ─────────────────────────────────────────────────────────────────────────────
// router.post('/validate-promo', (req, res) => {
//   const { code, amount } = req.body;

//   if (!code) {
//     return res.status(400).json({ valid: false, message: 'No promo code provided.' });
//   }

//   const promo = PROMO_CODES[code.toUpperCase()];

//   if (!promo) {
//     return res.status(400).json({ valid: false, message: 'Invalid promo code.' });
//   }

//   const { discount, finalAmount } = applyPromo(code, amount);

//   return res.status(200).json({
//     valid: true,
//     code: code.toUpperCase(),
//     type: promo.type,
//     value: promo.value || null,
//     discount,
//     finalAmount,
//     message: promo.message,
//   });
// });

router.post("/validate-promo", (req, res) => {
  const { code, amount, courseIds } = req.body; // ← add courseIds

  if (!code)
    return res
      .status(400)
      .json({ valid: false, message: "No promo code provided." });

  const promo = PROMO_CODES[code.toUpperCase()];
  if (!promo)
    return res
      .status(400)
      .json({ valid: false, message: "Invalid promo code." });

  const { discount, finalAmount, valid, message } = applyPromo(
    code,
    amount,
    courseIds || [],
  );

  if (!valid) return res.status(400).json({ valid: false, message });

  return res.status(200).json({
    valid: true,
    code: code.toUpperCase(),
    type: promo.type,
    value: promo.value || null,
    discount,
    finalAmount,
    message: promo.message,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /paystack/initialize
// Initializes a Paystack transaction for course(s) purchase.
// If a valid promo makes the amount $0, enrolls directly without Paystack.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/initialize", async (req, res) => {
  console.log(`[${getTimestamp()}] [Paystack] Received initialize request`);

  try {
    const { courseId, cartItems, userId, userEmail, amount, promoCode } =
      req.body;

    // ── Validation ──
    if (!userId) {
      console.warn(
        `[${getTimestamp()}] [Paystack] Validation failed: Missing userId`,
      );
      return res.status(400).json({ error: "Missing userId" });
    }
    if (!userEmail) {
      console.warn(
        `[${getTimestamp()}] [Paystack] Validation failed: Missing userEmail`,
      );
      return res.status(400).json({ error: "Missing userEmail" });
    }
    if (!amount || amount <= 0) {
      console.warn(
        `[${getTimestamp()}] [Paystack] Validation failed: Invalid amount`,
      );
      return res.status(400).json({ error: "Invalid amount" });
    }

    // ── Determine courses ──
    const coursesToPurchase =
      cartItems && Array.isArray(cartItems) && cartItems.length > 0
        ? cartItems
        : courseId
          ? [courseId]
          : [];

    if (coursesToPurchase.length === 0) {
      console.warn(
        `[${getTimestamp()}] [Paystack] Validation failed: No courses specified`,
      );
      return res.status(400).json({ error: "Missing courseId or cartItems" });
    }

    // ── Apply promo code ──
    // const { discount, finalAmount } = applyPromo(promoCode, amount);

    // if (promoCode) {
    //   console.log(
    //     `[${getTimestamp()}] [Paystack] Promo "${promoCode.toUpperCase()}" applied — Original: $${amount}, Discount: $${discount}, Final: $${finalAmount}`
    //   );
    // }

    const { discount, finalAmount, valid, message } = applyPromo(
      promoCode,
      amount,
      coursesToPurchase,
    );

    if (promoCode && !valid) {
      return res
        .status(400)
        .json({ error: message || "Invalid promo code for these courses." });
    }

    // ── Free checkout — skip Paystack entirely ──
    if (finalAmount === 0) {
      console.log(
        `[${getTimestamp()}] [Paystack] Free checkout — enrolling directly without payment`,
      );

      await authenticatePocketBase();

      const promoReference = `PROMO-${(promoCode || "FREE").toUpperCase()}-${Date.now()}`;
      const { enrollments, enrollmentErrors } = await createEnrollments(
        coursesToPurchase,
        userId,
        promoReference,
      );

      if (enrollments.length > 0) {
        console.log(
          `[${getTimestamp()}] [Paystack] Free enrollment successful for ${enrollments.length} course(s)`,
        );
        return res.status(200).json({
          free: true,
          enrollments,
          errors: enrollmentErrors.length > 0 ? enrollmentErrors : undefined,
          redirect: `${FRONTEND_URL}/success`,
        });
      } else {
        console.error(`[${getTimestamp()}] [Paystack] Free enrollment failed`);
        return res.status(500).json({
          error: "Failed to enroll. Please contact support.",
          errors: enrollmentErrors,
        });
      }
    }

    // ── Paid checkout — initialize Paystack ──
    console.log(
      `[${getTimestamp()}] [Paystack] Initializing for ${coursesToPurchase.length} course(s), User: ${userId}, Amount: $${finalAmount} USD`,
    );

    // Convert USD → KES → kobo (Paystack smallest unit)
    const amountInCents = Math.round(finalAmount * 100);

    console.log(
      `[${getTimestamp()}] [Paystack] USD: ${finalAmount} → KES: ${amountInKes} (rate: ${USD_TO_KES_RATE}) → kobo: ${amountInCents}`,
    );

    // Use custom_fields so Paystack reliably returns data on /verify
    const metadata = {
      cancel_action: `${FRONTEND_URL}/cancel`,
      custom_fields: [
        {
          display_name: "User ID",
          variable_name: "userId",
          value: userId,
        },
        {
          display_name: "Course ID",
          variable_name: "courseId",
          value: courseId || "",
        },
        {
          display_name: "Cart Items",
          variable_name: "cartItems",
          value: JSON.stringify(coursesToPurchase),
        },
        {
          display_name: "USD Amount",
          variable_name: "usdAmount",
          value: String(finalAmount),
        },
        {
          display_name: "Promo Code",
          variable_name: "promoCode",
          value: promoCode ? promoCode.toUpperCase() : "",
        },
      ],
    };

    console.log(
      `[${getTimestamp()}] [Paystack] Metadata:`,
      JSON.stringify(metadata),
    );

    const response = await axios.post(
      `${PAYSTACK_API_BASE}/transaction/initialize`,
      {
        email: userEmail,
        amount: amountInCents,
        metadata,
        callback_url: `${FRONTEND_URL}/success`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.data.status) {
      console.error(
        `[${getTimestamp()}] [Paystack] API returned error: ${response.data.message}`,
      );
      return res.status(400).json({ error: response.data.message });
    }

    const { authorization_url, reference } = response.data.data;
    console.log(
      `[${getTimestamp()}] [Paystack] Transaction initialized. Reference: ${reference}`,
    );

    return res.status(200).json({ authorization_url, reference });
  } catch (error) {
    console.error(
      `[${getTimestamp()}] [Paystack] Initialize error: ${error.message}`,
    );

    if (error.response?.data) {
      console.error(
        `[${getTimestamp()}] [Paystack] API error details:`,
        error.response.data,
      );
    }

    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return res.status(503).json({
        error: "Paystack service unavailable",
        details: error.message,
      });
    }

    return res.status(500).json({
      error: "Failed to initialize transaction",
      details: error.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /paystack/verify
// Verifies a Paystack transaction and creates enrollment records.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/verify", async (req, res) => {
  console.log(`[${getTimestamp()}] [Paystack] Received verify request`);

  try {
    const { reference } = req.body;

    if (!reference) {
      console.warn(
        `[${getTimestamp()}] [Paystack] Validation failed: Missing reference`,
      );
      return res.status(400).json({ error: "Missing reference" });
    }

    console.log(
      `[${getTimestamp()}] [Paystack] Verifying transaction: ${reference}`,
    );

    const response = await axios.get(
      `${PAYSTACK_API_BASE}/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      },
    );

    if (!response.data.status) {
      console.error(
        `[${getTimestamp()}] [Paystack] Verification failed: ${response.data.message}`,
      );
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    const transaction = response.data.data;

    console.log(
      `[${getTimestamp()}] [Paystack] Full transaction:`,
      JSON.stringify(transaction, null, 2),
    );

    if (transaction.status !== "success") {
      console.log(
        `[${getTimestamp()}] [Paystack] Transaction status: ${transaction.status}`,
      );
      return res
        .status(400)
        .json({ success: false, message: "Payment not successful" });
    }

    console.log(
      `[${getTimestamp()}] [Paystack] Transaction verified. Reference: ${reference}`,
    );

    // ── Extract metadata from custom_fields ──
    const customFields = transaction.metadata?.custom_fields || [];
    const getField = (variableName) =>
      customFields.find((f) => f.variable_name === variableName)?.value ?? null;

    const userId = getField("userId");
    const courseId = getField("courseId");
    const cartItemsRaw = getField("cartItems");
    const promoCode = getField("promoCode");

    console.log(
      `[${getTimestamp()}] [Paystack] Extracted — userId: ${userId}, courseId: ${courseId}, cartItems: ${cartItemsRaw}, promoCode: ${promoCode}`,
    );

    if (!userId) {
      console.error(
        `[${getTimestamp()}] [Paystack] Missing userId in metadata`,
      );
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid transaction metadata: missing userId",
        });
    }

    // ── Determine courses to enroll ──
    let coursesToEnroll = [];
    try {
      const parsed = cartItemsRaw ? JSON.parse(cartItemsRaw) : [];
      coursesToEnroll =
        Array.isArray(parsed) && parsed.length > 0
          ? parsed
          : courseId
            ? [courseId]
            : [];
    } catch (parseErr) {
      console.warn(
        `[${getTimestamp()}] [Paystack] Could not parse cartItems, falling back to courseId`,
      );
      coursesToEnroll = courseId ? [courseId] : [];
    }

    if (coursesToEnroll.length === 0) {
      console.error(
        `[${getTimestamp()}] [Paystack] No courses found in metadata`,
      );
      return res
        .status(400)
        .json({ success: false, message: "No courses to enroll" });
    }

    console.log(
      `[${getTimestamp()}] [Paystack] Enrolling in ${coursesToEnroll.length} course(s):`,
      coursesToEnroll,
    );

    await authenticatePocketBase();

    const { enrollments, enrollmentErrors } = await createEnrollments(
      coursesToEnroll,
      userId,
      reference,
    );

    if (enrollments.length > 0) {
      console.log(
        `[${getTimestamp()}] [Paystack] Successfully processed ${enrollments.length} enrollment(s)`,
      );
      return res.status(200).json({
        success: true,
        enrollments,
        errors: enrollmentErrors.length > 0 ? enrollmentErrors : undefined,
      });
    } else {
      console.error(
        `[${getTimestamp()}] [Paystack] Failed to create any enrollments`,
      );
      return res.status(500).json({
        success: false,
        message: "Failed to create enrollments",
        errors: enrollmentErrors,
      });
    }
  } catch (error) {
    console.error(
      `[${getTimestamp()}] [Paystack] Verify error: ${error.message}`,
    );

    if (error.response?.data) {
      console.error(
        `[${getTimestamp()}] [Paystack] API error details:`,
        error.response.data,
      );
    }

    return res.status(500).json({
      success: false,
      message: "Failed to verify transaction",
      details: error.message,
    });
  }
});

export default router;
