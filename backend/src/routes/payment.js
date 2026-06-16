const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { authenticate } = require('../middleware/auth');
const prisma = require('../config/prisma');

// Ensure Razorpay instance is safely initialized only if keys exist
let razorpayInstance = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (e) {
  console.warn("Razorpay initialization failed, keys might be missing");
}

router.post('/create-order', authenticate, async (req, res) => {
  try {
    const amount = 999; // INR 999.00
    const currency = 'INR';

    if (!razorpayInstance) {
      // Dummy order creation for testing if razorpay keys aren't provided
      const dummyOrderId = "order_test_" + Date.now();
      
      const transaction = await prisma.transaction.create({
        data: {
          userId: req.user.id,
          amount: amount,
          currency: currency,
          orderId: dummyOrderId,
          status: 'PENDING',
        }
      });
      return res.json({ id: dummyOrderId, currency, amount: amount * 100, isDummy: true });
    }

    const options = {
      amount: amount * 100, // Razorpay uses paise
      currency: currency,
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await razorpayInstance.orders.create(options);

    await prisma.transaction.create({
      data: {
        userId: req.user.id,
        amount: amount,
        currency: currency,
        orderId: order.id,
        status: 'PENDING',
      }
    });

    res.json(order);
  } catch (error) {
    console.error('Error creating razorpay order:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
});

router.post('/verify', authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, isDummy } = req.body;

    if (isDummy) {
      // For testing without real razorpay
      await prisma.transaction.updateMany({
        where: { orderId: razorpay_order_id, userId: req.user.id },
        data: {
          status: 'SUCCESS',
          paymentId: razorpay_payment_id || "pay_test_dummy",
        }
      });

      await prisma.user.update({
        where: { id: req.user.id },
        data: { isPremium: true }
      });

      return res.json({ success: true, message: 'Payment verified (Dummy)' });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      await prisma.transaction.updateMany({
        where: { orderId: razorpay_order_id, userId: req.user.id },
        data: {
          status: 'SUCCESS',
          paymentId: razorpay_payment_id,
        }
      });

      await prisma.user.update({
        where: { id: req.user.id },
        data: { isPremium: true }
      });

      return res.json({ success: true, message: "Payment verified successfully" });
    } else {
      await prisma.transaction.updateMany({
        where: { orderId: razorpay_order_id, userId: req.user.id },
        data: { status: 'FAILED' }
      });
      return res.status(400).json({ message: "Invalid signature sent!" });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
