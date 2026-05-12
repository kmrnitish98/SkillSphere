import Stripe from 'stripe';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import Payment from '../models/Payment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { sendCoursePurchaseEmail } from '../utils/sendEmail.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── Helper: Send Invoice Email ──────────────────────────────────────────────
const sendInvoiceEmail = async (studentEmail, studentName, payment, course) => {
  const userEmail = process.env.SMTP_USER || process.env.EMAIL_USER;
  const userPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  // Only attempt if SMTP credentials are configured
  if (!userEmail || !userPass) {
    console.warn('⚠️ SMTP credentials not found. Invoice email skipped.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: userEmail,
      pass: userPass,
    },
  });

  const invoiceDate = new Date(payment.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(135deg, #16a34a, #4ade80); padding: 32px; text-align: center; }
      .header h1 { color: white; margin: 0; font-size: 26px; letter-spacing: 1px; }
      .header p { color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }
      .body { padding: 32px; }
      .greeting { font-size: 16px; color: #374151; margin-bottom: 20px; }
      .invoice-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 24px; margin: 20px 0; }
      .invoice-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
      .invoice-row:last-child { border-bottom: none; font-weight: bold; font-size: 16px; color: #16a34a; }
      .label { color: #6b7280; font-size: 14px; }
      .value { color: #111827; font-size: 14px; font-weight: 600; }
      .course-title { font-size: 18px; font-weight: bold; color: #111827; margin: 16px 0 8px; }
      .badge { display: inline-block; background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
      .footer { background: #f9fafb; padding: 20px 32px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
      .receipt-btn { display: inline-block; margin: 20px 0; background: #16a34a; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎓 SkillSphere</h1>
        <p>Payment Successful &amp; Enrollment Confirmed</p>
      </div>
      <div class="body">
        <p class="greeting">Hi <strong>${studentName}</strong>,</p>
        <p style="color:#374151;font-size:14px;">Thank you for your purchase! You are now enrolled in the course below. Here is your invoice for reference.</p>
        
        <div class="badge">✅ Payment Confirmed</div>
        <p class="course-title">${course.title}</p>
        <p style="color:#6b7280;font-size:13px;margin:0 0 10px;">Instructor: ${course.mentor?.name || 'Expert Mentor'}</p>
        <p style="color:#4b5563;font-size:14px;margin:0 0 20px;line-height:1.5;">${course.description ? course.description.substring(0, 120) + '...' : 'Get ready to enhance your skills with this comprehensive course!'}</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/student/player?courseId=${course._id}" style="display:inline-block;background:#16a34a;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;box-shadow:0 4px 12px rgba(22,163,74,0.3);">🚀 Start Learning Now</a>
        </div>

        <div class="invoice-box">
          <div class="invoice-row">
            <span class="label">Invoice No.</span>
            <span class="value">${payment.invoiceNumber}</span>
          </div>
          <div class="invoice-row">
            <span class="label">Date</span>
            <span class="value">${invoiceDate}</span>
          </div>
          <div class="invoice-row">
            <span class="label">Transaction ID</span>
            <span class="value">${payment.transactionId}</span>
          </div>
          <div class="invoice-row">
            <span class="label">Course Price</span>
            <span class="value">₹${payment.amountPaid.toFixed(2)}</span>
          </div>
          <div class="invoice-row">
            <span class="label">Total Paid</span>
            <span class="value">₹${payment.amountPaid.toFixed(2)}</span>
          </div>
        </div>

        ${payment.receiptUrl ? `<div style="text-align:center;margin-top:20px;"><a href="${payment.receiptUrl}" class="receipt-btn" style="background:#e5e7eb;color:#374151;">📄 View Stripe Receipt</a></div>` : ''}

        <p style="color:#6b7280;font-size:13px;margin-top:20px;text-align:center;">You can access your course anytime from your <strong>Student Dashboard</strong>. Happy learning!</p>
      </div>
      <div class="footer">
        <p>SkillSphere Learning Platform • support@skillsphere.com</p>
        <p>© ${new Date().getFullYear()} SkillSphere. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>`;

  await transporter.sendMail({
    from: `"SkillSphere" <${userEmail}>`,
    to: studentEmail,
    subject: `🎓 Invoice ${payment.invoiceNumber} — ${course.title}`,
    html,
  });
};

// ─── Helper: Generate PDF Invoice Buffer ──────────────────────────────────────
const generateInvoicePDF = (payment, student, course) => {
  return new Promise((resolve, reject) => {
    const doc  = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const green  = '#16a34a';
    const dark   = '#111827';
    const grey   = '#6b7280';
    const light  = '#f3f4f6';

    // ── Header ──
    doc.rect(0, 0, doc.page.width, 90).fill(green);
    doc.fillColor('white').fontSize(26).font('Helvetica-Bold').text('SkillSphere', 50, 28);
    doc.fontSize(11).font('Helvetica').text('Learning Platform', 50, 58);
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('INVOICE', 0, 32, { align: 'right' });
    doc.moveDown(3);

    // ── Invoice meta ──
    doc.fillColor(dark).fontSize(11).font('Helvetica-Bold').text('INVOICE DETAILS', 50, 110);
    doc.moveTo(50, 125).lineTo(545, 125).strokeColor(green).stroke();
    doc.moveDown(0.5);

    const metaY = 135;
    doc.fillColor(grey).fontSize(10).font('Helvetica')
      .text('Invoice No.', 50, metaY)
      .text('Date', 50, metaY + 20)
      .text('Transaction ID', 50, metaY + 40)
      .text('Payment Status', 50, metaY + 60);

    doc.fillColor(dark).font('Helvetica-Bold')
      .text(payment.invoiceNumber, 200, metaY)
      .text(new Date(payment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), 200, metaY + 20)
      .text(payment.transactionId, 200, metaY + 40)
      .text('COMPLETED', 200, metaY + 60, { fillColor: green });

    // ── Bill To ──
    doc.fillColor(dark).fontSize(11).font('Helvetica-Bold').text('BILLED TO', 50, metaY + 100);
    doc.moveTo(50, metaY + 115).lineTo(545, metaY + 115).strokeColor(green).stroke();
    doc.fillColor(dark).fontSize(10).font('Helvetica-Bold').text(student.name, 50, metaY + 125);
    doc.fillColor(grey).font('Helvetica').text(student.email, 50, metaY + 141);

    // ── Course Table ──
    const tableY = metaY + 185;
    doc.rect(50, tableY, 495, 32).fill(green);
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
      .text('DESCRIPTION', 60, tableY + 10)
      .text('AMOUNT', 490, tableY + 10, { align: 'right' });

    const rowY = tableY + 32;
    doc.rect(50, rowY, 495, 48).fill(light);
    doc.fillColor(dark).fontSize(10).font('Helvetica-Bold').text(course.title, 60, rowY + 10);
    doc.fillColor(grey).font('Helvetica').fontSize(9).text(`Instructor: ${course.mentor?.name || 'Expert Mentor'}`, 60, rowY + 27);
    doc.fillColor(dark).font('Helvetica-Bold').fontSize(12).text(`Rs.${payment.amountPaid.toFixed(2)}`, 490, rowY + 18, { align: 'right' });

    // ── Totals ──
    const totalY = rowY + 68;
    doc.rect(350, totalY, 195, 32).fill(green);
    doc.fillColor('white').fontSize(12).font('Helvetica-Bold')
      .text('TOTAL PAID', 360, totalY + 9)
      .text(`Rs.${payment.amountPaid.toFixed(2)}`, 540, totalY + 9, { align: 'right' });

    // ── Footer ──
    doc.fillColor(grey).fontSize(9).font('Helvetica')
      .text('Thank you for learning with SkillSphere!', 50, 730, { align: 'center' })
      .text('support@skillsphere.com  •  www.skillsphere.com', 50, 745, { align: 'center' });

    doc.end();
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create Stripe PaymentIntent (Step 1 of checkout)
// @route   POST /api/v1/payments/create-payment-intent
// @access  Private/Student
// ─────────────────────────────────────────────────────────────────────────────
export const createPaymentIntent = async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId).populate('mentor', 'name email');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // Prevent re-purchase: check if already enrolled
    const existing = await Payment.findOne({ student: req.user._id, course: courseId, status: 'completed' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You are already enrolled in this course' });
    }

    const amountInPaise = Math.round(course.price * 100); // Stripe needs smallest unit

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountInPaise,
      currency: 'inr',
      metadata: {
        courseId:    courseId.toString(),
        studentId:   req.user._id.toString(),
        courseName:  course.title,
        studentName: req.user.name,
        studentEmail: req.user.email,
      },
      description: `SkillSphere — ${course.title}`,
      receipt_email: req.user.email,
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      course: {
        title: course.title,
        price: course.price,
        thumbnail: course.thumbnailUrl,
        mentorName: course.mentor?.name,
      },
    });
  } catch (error) {
    console.error('createPaymentIntent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Confirm payment after Stripe card success (Step 2)
// @route   POST /api/v1/payments/confirm
// @access  Private/Student
// ─────────────────────────────────────────────────────────────────────────────
export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, courseId } = req.body;

    // Retrieve & verify the PaymentIntent from Stripe
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!intent || intent.status !== 'succeeded') {
      return res.status(400).json({ success: false, message: 'Payment not completed on Stripe' });
    }

    // Guard: avoid duplicate records
    const duplicate = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    if (duplicate) {
      return res.status(200).json({ success: true, data: duplicate, message: 'Payment already recorded' });
    }

    const course = await Course.findById(courseId).populate('mentor', 'name email');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const student = await User.findById(req.user._id);

    const amountPaid     = course.price;
    const platformFee    = parseFloat((amountPaid * 0.20).toFixed(2));
    const mentorEarnings = parseFloat((amountPaid * 0.80).toFixed(2));

    // Get receipt URL from latest charge
    let receiptUrl = null;
    let chargeId   = null;
    if (intent.latest_charge) {
      const charge = await stripe.charges.retrieve(intent.latest_charge);
      receiptUrl   = charge.receipt_url;
      chargeId     = charge.id;
    }

    const payment = await Payment.create({
      student:               req.user._id,
      course:                courseId,
      amountPaid,
      platformFee,
      mentorEarnings,
      transactionId:         paymentIntentId,
      stripePaymentIntentId: paymentIntentId,
      stripeChargeId:        chargeId,
      receiptUrl,
      status:                'completed',
      currency:              'inr',
    });

    // Update course student count directly to avoid validation errors on old courses missing new required fields (like category)
    await Course.findByIdAndUpdate(courseId, { $inc: { studentCount: 1 } });
    course.studentCount += 1; // Update local object for the email template

    // Send invoice email (non-blocking) via nodemailer
    sendInvoiceEmail(student.email, student.name, payment, course).catch((e) =>
      console.warn('Invoice email failed (non-fatal):', e.message)
    );

    // Send course purchase success email via Resend (non-blocking)
    const courseUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/student/player?courseId=${course._id}`;
    sendCoursePurchaseEmail({
      to: student.email,
      studentName: student.name,
      courseName: course.title,
      courseUrl,
      orderId: payment.invoiceNumber || payment._id.toString()
    });

    res.status(201).json({
      success:       true,
      data:          payment,
      invoiceNumber: payment.invoiceNumber,
      receiptUrl,
      message:       'Enrollment confirmed! Check your email for the invoice.',
    });
  } catch (error) {
    console.error('confirmPayment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Download PDF invoice for a payment
// @route   GET /api/v1/payments/:paymentId/invoice
// @access  Private/Student (own) | Admin
// ─────────────────────────────────────────────────────────────────────────────
export const downloadInvoice = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('student', 'name email')
      .populate({ path: 'course', populate: { path: 'mentor', select: 'name' } });

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    // Auth guard: student can only download their own invoice
    if (
      req.user.role === 'student' &&
      payment.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const pdfBuffer = await generateInvoicePDF(payment, payment.student, payment.course);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${payment.invoiceNumber || 'invoice'}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('downloadInvoice error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all payments for logged-in student
// @route   GET /api/v1/payments/my
// @access  Private/Student
// ─────────────────────────────────────────────────────────────────────────────
export const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user._id, status: 'completed' })
      .populate({
        path: 'course',
        select: 'title thumbnailUrl price mentor',
        populate: { path: 'mentor', select: 'name avatar' }
      })
      .sort({ createdAt: -1 });
    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get mentor earnings
// @route   GET /api/v1/payments/earnings
// @access  Private/Mentor
// ─────────────────────────────────────────────────────────────────────────────
export const getMentorEarnings = async (req, res) => {
  try {
    const courses   = await Course.find({ mentor: req.user._id }).select('_id');
    const courseIds = courses.map((c) => c._id);

    const payments = await Payment.find({ course: { $in: courseIds }, status: 'completed' })
      .populate('course', 'title')
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

    const totalEarnings = payments.reduce((acc, curr) => acc + curr.mentorEarnings, 0);
    res.json({ success: true, count: payments.length, totalEarnings, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get platform revenue (Admin)
// @route   GET /api/v1/payments/revenue
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getPlatformRevenue = async (req, res) => {
  try {
    const payments     = await Payment.find({ status: 'completed' })
      .populate('course', 'title')
      .populate('student', 'name email')
      .sort({ createdAt: -1 });
    const totalRevenue = payments.reduce((acc, curr) => acc + curr.platformFee, 0);
    res.json({ success: true, count: payments.length, totalRevenue, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Stripe Webhook handler (optional but recommended for production)
// @route   POST /api/v1/payments/webhook
// @access  Public (Stripe signed)
// ─────────────────────────────────────────────────────────────────────────────
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    // Idempotency guard
    const exists = await Payment.findOne({ stripePaymentIntentId: intent.id });
    if (!exists) {
      console.log(`Webhook: PaymentIntent ${intent.id} succeeded (no record found, may need manual confirmation)`);
    }
  }

  res.json({ received: true });
};
