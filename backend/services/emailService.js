const nodemailer = require('nodemailer');

let transporter = null;

const initializeEmailService = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email service not configured. Escalation emails will be logged only.');
    return null;
  }

  transporter = nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  return transporter;
};

const sendEscalationEmail = async (escalationData) => {
  try {
    const { userId, message, sentiment, userProfile, timestamp } = escalationData;

    const emailContent = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to same email for demo
      subject: `🚨 Chatbot Escalation Alert - User ${userId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Chatbot Escalation Alert</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>User Information</h3>
            <p><strong>User ID:</strong> ${userId}</p>
            <p><strong>Name:</strong> ${userProfile.name || 'Not provided'}</p>
            <p><strong>Email:</strong> ${userProfile.email || 'Not provided'}</p>
            <p><strong>Language:</strong> ${userProfile.language || 'en'}</p>
          </div>

          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3>Message Details</h3>
            <p><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}</p>
            <p><strong>Sentiment:</strong> <span style="color: ${sentiment === 'negative' ? '#dc2626' : '#059669'};">${sentiment.toUpperCase()}</span></p>
            <p><strong>User Message:</strong></p>
            <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
              "${message}"
            </div>
          </div>

          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Recommended Actions</h3>
            <ul>
              <li>Respond to the user within 15 minutes</li>
              <li>Address their specific concerns</li>
              <li>Follow up to ensure satisfaction</li>
              ${sentiment === 'negative' ? '<li><strong>Priority:</strong> High - Negative sentiment detected</li>' : ''}
            </ul>
          </div>

          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            This is an automated message from the AI Chatbot System.
          </p>
        </div>
      `
    };

    if (!transporter) {
      initializeEmailService();
    }

    if (transporter) {
      await transporter.sendMail(emailContent);
      console.log(`Escalation email sent for user ${userId}`);
    } else {
      // Log escalation if email is not configured
      console.log('ESCALATION ALERT:', JSON.stringify(escalationData, null, 2));
    }

    return true;
  } catch (error) {
    console.error('Email service error:', error);
    // Don't throw error - escalation should not fail chat service
    return false;
  }
};

const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    if (!transporter) {
      initializeEmailService();
    }

    if (!transporter) {
      console.log('Welcome email would be sent to:', userEmail);
      return true;
    }

    const emailContent = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Welcome to AI Chatbot Demo!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Welcome to AI Chatbot Demo!</h2>
          
          <p>Hi ${userName || 'there'},</p>
          
          <p>Thank you for trying our AI-powered chatbot! Here's what you can do:</p>
          
          <ul>
            <li>🤖 Chat with our AI assistant in English or Spanish</li>
            <li>😊 Experience sentiment-aware responses</li>
            <li>🎤 Use voice input (coming soon)</li>
            <li>👨‍💼 Request human assistance when needed</li>
          </ul>
          
          <p>If you need help, just type "help" or "agent" in the chat.</p>
          
          <p>Happy chatting!</p>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            This is an automated message from the AI Chatbot Demo.
          </p>
        </div>
      `
    };

    await transporter.sendMail(emailContent);
    console.log(`Welcome email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Welcome email error:', error);
    return false;
  }
};

module.exports = {
  sendEscalationEmail,
  sendWelcomeEmail,
  initializeEmailService
};
