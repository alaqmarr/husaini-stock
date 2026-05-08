import nodemailer from 'nodemailer';

export async function sendLowStockEmail(productName: string, currentStock: number) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass || user === 'your-gmail-address@gmail.com') {
    console.log('Skipping email alert: EMAIL_USER or EMAIL_PASS not configured.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });

  const mailOptions = {
    from: user,
    to: user, // Send to self as it's an admin alert
    subject: `Low Stock Alert: ${productName}`,
    html: `
      <h2>Low Stock Alert</h2>
      <p>The stock for <strong>${productName}</strong> has dropped to <strong>${currentStock}</strong> cartons.</p>
      <p>Please restock soon to avoid running out.</p>
      <hr />
      <p style="font-size: 12px; color: #888;">This is an automated message from your Stock Management System.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Low stock email sent for ${productName}`);
  } catch (error) {
    console.error('Error sending low stock email:', error);
  }
}
