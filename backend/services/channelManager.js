const { sendWhatsAppMessage } = require('../integrations/whatsapp');
const { sendSlackMessage } = require('../integrations/slack');

class ChannelManager {
  constructor() {
    this.channels = {
      web: this.sendWebMessage.bind(this),
      mobile: this.sendMobileMessage.bind(this),
      whatsapp: this.sendWhatsAppResponse.bind(this),
      slack: this.sendSlackResponse.bind(this)
    };
  }

  async sendResponse(channel, recipient, message, options = {}) {
    try {
      const handler = this.channels[channel];
      if (!handler) {
        throw new Error(`Unsupported channel: ${channel}`);
      }

      await handler(recipient, message, options);
      console.log(`Message sent via ${channel} to ${recipient}`);
    } catch (error) {
      console.error(`Error sending message via ${channel}:`, error);
      throw error;
    }
  }

  async sendWebMessage(socketId, message, options = {}) {
    // This will be handled by Socket.IO in the main server
    // Just log for now
    console.log(`Web message for ${socketId}: ${message}`);
  }

  async sendMobileMessage(socketId, message, options = {}) {
    // This will be handled by Socket.IO in the main server
    // Just log for now
    console.log(`Mobile message for ${socketId}: ${message}`);
  }

  async sendWhatsAppResponse(phoneNumber, message, options = {}) {
    await sendWhatsAppMessage(phoneNumber, message);
  }

  async sendSlackResponse(channelId, message, options = {}) {
    await sendSlackMessage(channelId, message, options);
  }

  // Broadcast message to multiple channels
  async broadcast(recipients, message, options = {}) {
    const promises = recipients.map(({ channel, recipient }) =>
      this.sendResponse(channel, recipient, message, options)
    );

    try {
      await Promise.all(promises);
      console.log(`Broadcast sent to ${recipients.length} channels`);
    } catch (error) {
      console.error('Error in broadcast:', error);
      throw error;
    }
  }

  // Get channel-specific formatting
  formatMessage(channel, message, options = {}) {
    switch (channel) {
      case 'whatsapp':
        return this.formatWhatsAppMessage(message, options);
      case 'slack':
        return this.formatSlackMessage(message, options);
      case 'web':
      case 'mobile':
        return this.formatWebMessage(message, options);
      default:
        return message;
    }
  }

  formatWhatsAppMessage(message, options = {}) {
    let formatted = message;

    // Add emojis for WhatsApp
    if (options.sentiment === 'positive') {
      formatted = `😊 ${formatted}`;
    } else if (options.sentiment === 'negative') {
      formatted = `😔 ${formatted}`;
    }

    // Add escalation notice
    if (options.escalated) {
      formatted += '\n\n🚨 *This conversation has been escalated to a human agent.*';
    }

    return formatted;
  }

  formatSlackMessage(message, options = {}) {
    // Slack formatting is handled in the slack integration
    return message;
  }

  formatWebMessage(message, options = {}) {
    // Web formatting is handled by the frontend
    return message;
  }

  // Channel-specific user identification
  getUserId(channel, identifier) {
    switch (channel) {
      case 'whatsapp':
        return `whatsapp_${identifier}`;
      case 'slack':
        return `slack_${identifier}`;
      case 'mobile':
        return `mobile_${identifier}`;
      case 'web':
        return `web_${identifier}`;
      default:
        return identifier;
    }
  }

  // Extract channel from user ID
  getChannelFromUserId(userId) {
    if (userId.startsWith('whatsapp_')) return 'whatsapp';
    if (userId.startsWith('slack_')) return 'slack';
    if (userId.startsWith('mobile_')) return 'mobile';
    return 'web';
  }

  // Channel capabilities
  getChannelCapabilities(channel) {
    const capabilities = {
      web: {
        supportsRichText: true,
        supportsVoiceMessages: true,
        supportsFiles: true,
        supportsButtons: true,
        supportsEmojis: true,
        maxMessageLength: 10000
      },
      mobile: {
        supportsRichText: true,
        supportsVoiceMessages: true,
        supportsFiles: true,
        supportsButtons: true,
        supportsEmojis: true,
        maxMessageLength: 10000
      },
      whatsapp: {
        supportsRichText: false,
        supportsVoiceMessages: true,
        supportsFiles: true,
        supportsButtons: true,
        supportsEmojis: true,
        maxMessageLength: 4096
      },
      slack: {
        supportsRichText: true,
        supportsVoiceMessages: false,
        supportsFiles: true,
        supportsButtons: true,
        supportsEmojis: true,
        maxMessageLength: 40000
      }
    };

    return capabilities[channel] || capabilities.web;
  }

  // Validate message for channel
  validateMessage(channel, message) {
    const capabilities = this.getChannelCapabilities(channel);
    
    if (message.length > capabilities.maxMessageLength) {
      throw new Error(`Message too long for ${channel}. Max length: ${capabilities.maxMessageLength}`);
    }

    return true;
  }

  // Get active channels
  getActiveChannels() {
    return Object.keys(this.channels);
  }

  // Channel statistics
  getChannelStats() {
    return {
      totalChannels: Object.keys(this.channels).length,
      supportedChannels: this.getActiveChannels(),
      capabilities: Object.keys(this.channels).reduce((acc, channel) => {
        acc[channel] = this.getChannelCapabilities(channel);
        return acc;
      }, {})
    };
  }
}

// Singleton instance
const channelManager = new ChannelManager();

module.exports = {
  ChannelManager,
  channelManager
};
