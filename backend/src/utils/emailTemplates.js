// utils/emailTemplates.js

/**
 * Generates rich HTML + text templates for each order status
 * @param {string} status
 * @param {object} param1
 * @returns {{subject:string, text:string, html:string}}
 */
export function templateForStatus(status, { order, actor, reason } = {}) {
  console.log("templateForStatus called with:", status, { orderId: order?._id, actor, reason });

  const s = String(status || "").trim().toLowerCase();

  // Basic info
  const siteName = "Urban District";
  const siteURL = "https://yourstore.com";
  const supportEmail = "support@yourstore.com";
  const trackingURL = order?.shipment?.trackingNumber
    ? `${siteURL}/track/${order.shipment.trackingNumber}`
    : null;

  // Common layout parts
  const header = `
  <div style="background:#000;color:#fff;padding:20px;text-align:center;font-family:'Inter',Arial,sans-serif;">
    <h1 style="margin:0;font-size:24px;">${siteName}</h1>
  </div>`;

  const footer = `
  <div style="background:#f9f9f9;color:#555;padding:20px;text-align:center;font-family:'Inter',Arial,sans-serif;font-size:13px;">
    <p>Need help? <a href="mailto:${supportEmail}" style="color:#000;text-decoration:none;">Contact support</a></p>
    <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
  </div>`;

  const wrapper = (content, color = "#000") => `
  <div style="font-family:'Inter',Arial,sans-serif;background:#fff;border-radius:8px;max-width:600px;margin:30px auto;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
    ${header}
    <div style="padding:32px 24px;">
      ${content}
      <div style="margin-top:32px;text-align:center;">
        <a href="${siteURL}/orders/${order?.orderNumber}" 
          style="display:inline-block;background:${color};color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
          View Order
        </a>
      </div>
    </div>
    ${footer}
  </div>`;

  // Function to format dynamic order lines
  const orderSummary = order?.items?.length
    ? `<div style="margin-top:16px;">
        <h3 style="font-size:16px;margin-bottom:8px;">Order Summary</h3>
        ${order.items
          .map(
            (i) => `
            <div style="display:flex;align-items:center;margin-bottom:10px;">
              <img src="${i.mainImage}" alt="${i.title}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;margin-right:10px;">
              <div style="flex:1;">
                <p style="margin:0;font-weight:600;">${i.title}</p>
                <p style="margin:0;color:#666;font-size:13px;">Qty: ${i.quantity} • ₹${i.price}</p>
              </div>
            </div>`
          )
          .join("")}
      </div>`
    : "";

  // Unified design for all templates
  const templates = {
    pending: ({ order }) => {
      const subject = `Order ${order.orderNumber} — Received`;
      const body = `
        <h2>We've received your order 🎉</h2>
        <p>Hi ${order.shippingAddress?.firstName || ""},</p>
        <p>Your order <strong>${order.orderNumber}</strong> has been received successfully. We’ll confirm payment and update you soon.</p>
        ${orderSummary}
      `;
      return {
        subject,
        text: `Your order ${order.orderNumber} has been received.`,
        html: wrapper(body, "#111"),
      };
    },

    confirmed: ({ order }) => {
      const subject = `Order ${order.orderNumber} — Confirmed`;
      const body = `
        <h2>Your order is confirmed ✅</h2>
        <p>Hi ${order.shippingAddress?.firstName || ""},</p>
        <p>Your order <strong>${order.orderNumber}</strong> has been confirmed and will be processed shortly.</p>
        ${orderSummary}
      `;
      return {
        subject,
        text: `Your order ${order.orderNumber} has been confirmed.`,
        html: wrapper(body, "#008060"),
      };
    },

    dispatched: ({ order }) => {
      const subject = `Order ${order.orderNumber} — Dispatched`;
      const body = `
        <h2>Your order is on the way 🚚</h2>
        <p>Hi ${order.shippingAddress?.firstName || ""},</p>
        <p>Your order <strong>${order.orderNumber}</strong> has been dispatched from our warehouse.</p>
        ${trackingURL ? `<p>Track your order here: <a href="${trackingURL}">${trackingURL}</a></p>` : ""}
        ${orderSummary}
      `;
      return {
        subject,
        text: `Your order ${order.orderNumber} has been dispatched.`,
        html: wrapper(body, "#0070f3"),
      };
    },

    shipped: ({ order }) => {
      const subject = `Order ${order.orderNumber} — Shipped`;
      const body = `
        <h2>Your order has shipped 📦</h2>
        <p>Hi ${order.shippingAddress?.firstName || ""},</p>
        <p>Your order <strong>${order.orderNumber}</strong> is now on its way.</p>
        ${trackingURL ? `<p><a href="${trackingURL}" style="color:#0070f3;">Track your shipment here</a></p>` : ""}
        ${orderSummary}
      `;
      return {
        subject,
        text: `Your order ${order.orderNumber} has shipped.`,
        html: wrapper(body, "#0070f3"),
      };
    },

    "out for delivery": ({ order }) => {
      const subject = `Order ${order.orderNumber} — Out for Delivery`;
      const body = `
        <h2>Your order is out for delivery 🚴‍♂️</h2>
        <p>Hi ${order.shippingAddress?.firstName || ""},</p>
        <p>Your order <strong>${order.orderNumber}</strong> is out for delivery today. Please ensure someone is available to receive it.</p>
        ${orderSummary}
      `;
      return {
        subject,
        text: `Your order ${order.orderNumber} is out for delivery.`,
        html: wrapper(body, "#ff9500"),
      };
    },

    delivered: ({ order }) => {
      const subject = `Order ${order.orderNumber} — Delivered`;
      const body = `
        <h2>Your order has been delivered 🎁</h2>
        <p>Hi ${order.shippingAddress?.firstName || ""},</p>
        <p>We're happy to let you know that your order <strong>${order.orderNumber}</strong> has been delivered. We hope you love it!</p>
        <p>If you’d like to share feedback or report an issue, <a href="${siteURL}/contact">click here</a>.</p>
        ${orderSummary}
      `;
      return {
        subject,
        text: `Your order ${order.orderNumber} has been delivered.`,
        html: wrapper(body, "#28a745"),
      };
    },

    cancelled: ({ order, reason }) => {
      const subject = `Order ${order.orderNumber} — Cancelled`;
      const body = `
        <h2>Order Cancelled ❌</h2>
        <p>Hi ${order.shippingAddress?.firstName || ""},</p>
        <p>Your order <strong>${order.orderNumber}</strong> has been cancelled.${reason ? ` <br/>Reason: ${reason}` : ""}</p>
        <p>If this was a mistake, please contact our support immediately.</p>
      `;
      return {
        subject,
        text: `Your order ${order.orderNumber} has been cancelled. ${reason ? `Reason: ${reason}` : ""}`,
        html: wrapper(body, "#d9534f"),
      };
    },

    refunded: ({ order, reason }) => {
      const subject = `Order ${order.orderNumber} — Refund Processed`;
      const body = `
        <h2>Your refund has been processed 💸</h2>
        <p>Hi ${order.shippingAddress?.firstName || ""},</p>
        <p>A refund for your order <strong>${order.orderNumber}</strong> has been processed successfully.${reason ? `<br/>Reason: ${reason}` : ""}</p>
        <p>The amount will reflect in your account within 3–5 business days.</p>
      `;
      return {
        subject,
        text: `Refund for order ${order.orderNumber} processed. ${reason ? `Reason: ${reason}` : ""}`,
        html: wrapper(body, "#6c63ff"),
      };
    },
  };

  const fn = templates[s] || templates.pending;
  return fn({ order, actor, reason });
}
