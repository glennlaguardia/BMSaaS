/**
 * BudaBook — Email Service (Resend Placeholder)
 *
 * Provides functions for sending transactional emails:
 * - Booking confirmation
 * - Cancellation notice
 * - Handler (staff) notification
 *
 * When RESEND_API_KEY is configured, emails are sent via Resend.
 * Otherwise, email content is logged to console for development.
 */

interface EmailPayload {
    to: string;
    subject: string;
    html: string;
}

async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
    const apiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'BudaBook <noreply@budabook.com>';

    if (!apiKey) {
        console.log('[Email] RESEND_API_KEY not configured — logging email instead:');
        console.log(`  To: ${payload.to}`);
        console.log(`  Subject: ${payload.subject}`);
        console.log(`  Body: ${payload.html.substring(0, 200)}...`);
        return { success: true };
    }

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: fromAddress,
                to: payload.to,
                subject: payload.subject,
                html: payload.html,
            }),
        });

        if (!res.ok) {
            const error = await res.text();
            console.error('[Email] Resend API error:', error);
            return { success: false, error };
        }

        return { success: true };
    } catch (err) {
        console.error('[Email] Failed to send:', err);
        return { success: false, error: String(err) };
    }
}

// ---- Booking Confirmation ----

interface BookingConfirmationData {
    guestName: string;
    guestEmail: string;
    referenceNumber: string;
    accommodationName: string;
    roomName: string;
    checkInDate: string;
    checkOutDate: string;
    totalAmount: string;
    tenantName: string;
}

export async function sendBookingConfirmation(data: BookingConfirmationData) {
    return sendEmail({
        to: data.guestEmail,
        subject: `Booking Confirmed — ${data.referenceNumber} | ${data.tenantName}`,
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">Booking Confirmation</h2>
        <p>Hi ${data.guestName},</p>
        <p>Your booking has been received! Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #666;">Reference</td><td style="padding: 8px; font-weight: bold;">${data.referenceNumber}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Accommodation</td><td style="padding: 8px;">${data.accommodationName}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Room</td><td style="padding: 8px;">${data.roomName}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Check-in</td><td style="padding: 8px;">${data.checkInDate}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Check-out</td><td style="padding: 8px;">${data.checkOutDate}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Total</td><td style="padding: 8px; font-weight: bold;">${data.totalAmount}</td></tr>
        </table>
        <p style="color: #666; font-size: 14px;">Please check your email for payment instructions. Thank you for choosing ${data.tenantName}!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Powered by BudaBook</p>
      </div>
    `,
    });
}

// ---- Cancellation Notice ----

interface CancellationData {
    guestName: string;
    guestEmail: string;
    referenceNumber: string;
    reason?: string;
    tenantName: string;
}

export async function sendCancellationNotice(data: CancellationData) {
    return sendEmail({
        to: data.guestEmail,
        subject: `Booking Cancelled — ${data.referenceNumber} | ${data.tenantName}`,
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #b91c1c;">Booking Cancelled</h2>
        <p>Hi ${data.guestName},</p>
        <p>Your booking <strong>${data.referenceNumber}</strong> has been cancelled.</p>
        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
        <p style="color: #666; font-size: 14px;">If you have any questions, please contact ${data.tenantName} directly.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Powered by BudaBook</p>
      </div>
    `,
    });
}

// ---- Handler / Staff Notification ----

interface HandlerNotificationData {
    handlerEmail: string;
    guestName: string;
    referenceNumber: string;
    accommodationName: string;
    roomName: string;
    checkInDate: string;
    checkOutDate: string;
    totalAmount: string;
    tenantName: string;
}

export async function sendHandlerNotification(data: HandlerNotificationData) {
    return sendEmail({
        to: data.handlerEmail,
        subject: `New Booking — ${data.referenceNumber} | ${data.guestName}`,
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">New Booking Received</h2>
        <p>A new booking has been submitted for <strong>${data.tenantName}</strong>:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #666;">Guest</td><td style="padding: 8px; font-weight: bold;">${data.guestName}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Reference</td><td style="padding: 8px;">${data.referenceNumber}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Accommodation</td><td style="padding: 8px;">${data.accommodationName}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Room</td><td style="padding: 8px;">${data.roomName}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Check-in</td><td style="padding: 8px;">${data.checkInDate}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Check-out</td><td style="padding: 8px;">${data.checkOutDate}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Total</td><td style="padding: 8px; font-weight: bold;">${data.totalAmount}</td></tr>
        </table>
        <p style="color: #666; font-size: 14px;">Log in to the admin dashboard to manage this booking.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Powered by BudaBook</p>
      </div>
    `,
    });
}
