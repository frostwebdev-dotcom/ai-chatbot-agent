const express = require('express');
const { handleChatMessage } = require('../services/chatService');
const { sanitizeInput } = require('../utils/helpers');

const router = express.Router();

// WhatsApp webhook verification
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verify the webhook
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified');
    res.status(200).send(challenge);
  } else {
    console.error('WhatsApp webhook verification failed');
    res.status(403).send('Forbidden');
  }
});

// WhatsApp message handler
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Check if this is a WhatsApp message
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (value?.messages) {
        for (const message of value.messages) {
          await handleWhatsAppMessage(message, value);
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

async function handleWhatsAppMessage(message, value) {
  try {
    const phoneNumber = message.from;
    const messageText = message.text?.body;
    const messageType = message.type;

    console.log(`WhatsApp message from ${phoneNumber}: ${messageText}`);

    // Only handle text messages for now
    if (messageType !== 'text' || !messageText) {
      await sendWhatsAppMessage(phoneNumber, 'Sorry, I can only process text messages at the moment.');
      return;
    }

    // Sanitize input
    const sanitizedMessage = sanitizeInput(messageText);

    // Process with AI
    const response = await handleChatMessage({
      userId: `whatsapp_${phoneNumber}`,
      message: sanitizedMessage,
      language: 'en', // Could detect language here
      channel: 'whatsapp',
      metadata: {
        phoneNumber,
        platform: 'whatsapp'
      }
    });

    // Send response back to WhatsApp
    await sendWhatsAppMessage(phoneNumber, response.message);

    // Handle escalation
    if (response.escalated) {
      await sendWhatsAppMessage(
        phoneNumber, 
        'I\'m connecting you with a human agent who will contact you shortly.'
      );
    }

  } catch (error) {
    console.error('Error handling WhatsApp message:', error);
    await sendWhatsAppMessage(
      message.from, 
      'Sorry, I encountered an error. Please try again later.'
    );
  }
}

async function sendWhatsAppMessage(to, text) {
  try {
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: text
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.status}`);
    }

    console.log(`WhatsApp message sent to ${to}: ${text}`);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}

// WhatsApp template messages for common responses
const sendWhatsAppTemplate = async (to, templateName, parameters = []) => {
  try {
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'en'
        },
        components: parameters.length > 0 ? [{
          type: 'body',
          parameters: parameters.map(param => ({ type: 'text', text: param }))
        }] : []
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`WhatsApp template API error: ${response.status}`);
    }

    console.log(`WhatsApp template sent to ${to}: ${templateName}`);
  } catch (error) {
    console.error('Error sending WhatsApp template:', error);
  }
};

// WhatsApp media message handler
const handleWhatsAppMedia = async (message, value) => {
  const mediaId = message.image?.id || message.audio?.id || message.document?.id;
  
  if (mediaId) {
    await sendWhatsAppMessage(
      message.from,
      'I received your media file, but I can only process text messages at the moment. Please describe your question in text.'
    );
  }
};

module.exports = {
  router,
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  handleWhatsAppMedia
};
