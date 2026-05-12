import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  student:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:          { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  amountPaid:      { type: Number, required: true },            // in INR (₹)
  platformFee:     { type: Number, required: true },            // 20%
  mentorEarnings:  { type: Number, required: true },            // 80%
  status:          { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transactionId:   { type: String, required: true },            // Stripe PaymentIntent id

  // Stripe-specific
  stripePaymentIntentId: { type: String },
  stripeChargeId:        { type: String },
  receiptUrl:            { type: String },                      // Stripe hosted receipt

  // Invoice
  invoiceNumber:   { type: String, unique: true, sparse: true },
  invoiceUrl:      { type: String },                            // PDF stored on Cloudinary (optional)

  // Currency
  currency:        { type: String, default: 'inr' }
}, { timestamps: true });

// Auto-generate invoice number before saving completed payment
paymentSchema.pre('save', function () {
  if (this.status === 'completed' && !this.invoiceNumber) {
    const ts  = Date.now().toString().slice(-8);
    const rnd = Math.floor(Math.random() * 900 + 100);
    this.invoiceNumber = `INV-${ts}-${rnd}`;
  }
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
