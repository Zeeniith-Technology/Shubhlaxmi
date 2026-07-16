import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const BRAND = 'Shubhlaxmi';

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const itemLines = (items) => (items || []).map(item => {
    const opts = item.selectedOptions && Object.keys(item.selectedOptions).length > 0
        ? ` [${Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')}]`
        : '';
    return `  • ${item.quantity} x ${item.title || 'Product'}${opts} — ${formatINR(item.price * item.quantity)}`;
}).join('\n');

const addressBlock = (a) => a
    ? `${a.street}, ${a.city}, ${a.state} ${a.zipCode}, ${a.country || 'India'}`
    : '';

const shortId = (order) => String(order._id).slice(-8).toUpperCase();

// All senders are fire-and-forget: email failure must never fail the order API.
const send = async (to, subject, text) => {
    if (!to) return;
    try {
        await transporter.sendMail({ from: `"${BRAND}" <${process.env.EMAIL_USER}>`, to, subject, text });
    } catch (err) {
        console.error(`[Email] Failed to send "${subject}" to ${to}:`, err.message);
    }
};

export const sendOrderConfirmation = (user, order) => send(
    user?.email,
    `${BRAND} — Order Confirmed #${shortId(order)}`,
    `Hi ${user?.name || 'there'},

Thank you for shopping with ${BRAND}! Your order has been confirmed.

Order #${shortId(order)}
Payment: ${order.paymentMethod}${order.paymentMethod === 'Online' ? ' (Paid)' : ' (Pay on delivery)'}

Items:
${itemLines(order.items)}

Total: ${formatINR(order.totalAmount)}

Shipping to:
${addressBlock(order.shippingAddress)}

We'll email you again when your order ships.

— Team ${BRAND}`
);

export const sendOrderStatusUpdate = (user, order) => {
    let statusLine = `Your order #${shortId(order)} is now: ${order.status}`;
    if (order.status === 'Shipped') {
        statusLine += order.trackingNumber
            ? `\n\nTracking number: ${order.trackingNumber}${order.courierName ? `\nCourier: ${order.courierName}` : ''}`
            : '';
    }
    return send(
        user?.email,
        `${BRAND} — Order #${shortId(order)} ${order.status}`,
        `Hi ${user?.name || 'there'},

${statusLine}

Items:
${itemLines(order.items)}

Total: ${formatINR(order.totalAmount)}

— Team ${BRAND}`
    );
};

export const sendOrderCancellation = (user, order, refundNote = false) => send(
    user?.email,
    `${BRAND} — Order #${shortId(order)} Cancelled`,
    `Hi ${user?.name || 'there'},

Your order #${shortId(order)} has been cancelled.
${refundNote ? '\nSince this order was already paid, our team will process your refund within 5-7 business days.\n' : ''}
Items:
${itemLines(order.items)}

If you didn't request this cancellation, please contact us.

— Team ${BRAND}`
);
