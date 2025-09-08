const express = require('express');
const { handleChatMessage } = require('../services/chatService');
const { sanitizeInput } = require('../utils/helpers');

const router = express.Router();

// Check if Slack credentials are available
const isSlackEnabled = !!(process.env.SLACK_BOT_TOKEN && process.env.SLACK_SIGNING_SECRET);

let slack = null;
let slackEvents = null;

if (isSlackEnabled) {
  try {
    const { WebClient } = require('@slack/web-api');
    const { createEventAdapter } = require('@slack/events-api');

    // Initialize Slack Web API client
    slack = new WebClient(process.env.SLACK_BOT_TOKEN);

    // Initialize Slack Events API adapter
    slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);

    console.log('✅ Slack integration enabled');
  } catch (error) {
    console.error('❌ Slack integration failed to initialize:', error.message);
    console.log('⚠️ Slack features will be disabled');
  }
} else {
  console.log('⚠️ Slack integration disabled - missing credentials');
  console.log('💡 Set SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET to enable Slack features');
}

// In-memory storage for escalation mappings (use Redis in production)
const escalationMappings = new Map();

// Store escalation mapping
async function storeEscalationMapping(escalationId, userId, userChannel, slackThreadTs) {
  escalationMappings.set(escalationId, {
    userId,
    userChannel,
    slackThreadTs,
    status: 'active',
    createdAt: new Date().toISOString()
  });

  // Also store by thread timestamp for quick lookup
  escalationMappings.set(slackThreadTs, {
    escalationId,
    userId,
    userChannel,
    status: 'active'
  });
}

// Get escalation by thread timestamp
function getEscalationByThread(threadTs) {
  return escalationMappings.get(threadTs);
}

// Handle admin responses in escalation threads
async function handleEscalationResponse(event) {
  try {
    const escalation = getEscalationByThread(event.thread_ts);

    if (!escalation || escalation.status !== 'active') {
      console.log('No active escalation found for thread:', event.thread_ts);
      return;
    }

    const adminMessage = event.text;
    const adminUser = event.user;

    // Get admin user info
    let adminName = 'Support Agent';
    try {
      const userInfo = await slack.users.info({ user: adminUser });
      adminName = userInfo.user.real_name || userInfo.user.name || 'Support Agent';
    } catch (error) {
      console.warn('Could not get admin user info:', error.message);
    }

    console.log(`Admin ${adminName} responding to escalation ${escalation.escalationId}: ${adminMessage}`);

    // Send admin response to user via appropriate channel
    await sendAdminResponseToUser(escalation, adminMessage, adminName);

    // Add reaction to show message was forwarded
    try {
      await slack.reactions.add({
        channel: event.channel,
        timestamp: event.ts,
        name: 'white_check_mark'
      });
    } catch (error) {
      console.warn('Could not add reaction:', error.message);
    }

  } catch (error) {
    console.error('Error handling escalation response:', error);
  }
}

// Send admin response to user
async function sendAdminResponseToUser(escalation, message, adminName) {
  try {
    const { userId, userChannel } = escalation;

    // Send via appropriate channel
    switch (userChannel) {
      case 'web':
      case 'mobile':
        // Send via Socket.IO to web/mobile users
        await sendSocketIOMessage(userId, message, adminName);
        break;

      case 'whatsapp':
        // Send via WhatsApp
        const { sendWhatsAppMessage } = require('./whatsapp');
        const phoneNumber = userId.replace('whatsapp_', '');
        await sendWhatsAppMessage(phoneNumber, `*${adminName} (Support):* ${message}`);
        break;

      case 'slack':
        // Send via Slack DM
        const slackUserId = userId.replace('slack_', '');
        await slack.chat.postMessage({
          channel: slackUserId,
          text: `*${adminName} (Support):* ${message}`
        });
        break;

      default:
        console.warn('Unknown user channel:', userChannel);
    }

    console.log(`Admin response sent to ${userId} via ${userChannel}`);
  } catch (error) {
    console.error('Error sending admin response to user:', error);
  }
}

// Send message via Socket.IO (will be set by server.js)
let socketIOInstance = null;

function setSocketIOInstance(io) {
  socketIOInstance = io;
}

async function sendSocketIOMessage(userId, message, adminName) {
  if (!socketIOInstance) {
    console.warn('Socket.IO instance not available');
    return;
  }

  try {
    // Create admin message object
    const adminMessage = {
      id: Date.now(),
      type: 'admin',
      content: message,
      adminName: adminName,
      timestamp: new Date().toISOString(),
      isEscalation: true
    };

    // Send to specific user
    socketIOInstance.emit('admin_response', adminMessage);

    console.log(`Socket.IO message sent to ${userId} from ${adminName}`);
  } catch (error) {
    console.error('Error sending Socket.IO message:', error);
  }
}

// Slack event handlers (only if Slack is enabled)
if (slackEvents) {
  slackEvents.on('message', async (event) => {
    try {
      // Handle thread replies (admin responses to escalations)
      if (event.thread_ts && !event.bot_id) {
        await handleEscalationResponse(event);
        return;
      }

      // Ignore bot messages and other thread messages
      if (event.bot_id) {
        return;
      }

      // Ignore messages from our own bot
      if (event.user === process.env.SLACK_BOT_USER_ID) {
        return;
      }

      // Handle regular Slack messages (if not in escalation channel)
      if (event.channel !== process.env.SLACK_ESCALATION_CHANNEL) {
        await handleSlackMessage(event);
      }
    } catch (error) {
      console.error('Error handling Slack message:', error);
    }
  });

  // Slack app mentions
  slackEvents.on('app_mention', async (event) => {
    try {
      await handleSlackMessage(event, true);
    } catch (error) {
      console.error('Error handling Slack mention:', error);
    }
  });
}

// Slack slash commands
router.post('/commands', async (req, res) => {
  if (!isSlackEnabled) {
    return res.status(503).json({
      response_type: 'ephemeral',
      text: 'Slack integration is not configured on this server.'
    });
  }

  try {
    const { command, text, user_id, channel_id, user_name } = req.body;

    // Verify the request is from Slack
    if (!verifySlackRequest(req)) {
      return res.status(401).send('Unauthorized');
    }

    // Handle different slash commands
    switch (command) {
      case '/chatbot':
        await handleSlackSlashCommand(text, user_id, channel_id, user_name);
        res.json({
          response_type: 'in_channel',
          text: 'Processing your request...'
        });
        break;
      
      case '/chatbot-help':
        res.json({
          response_type: 'ephemeral',
          text: `🤖 *Chatbot Help*\n\n• Use \`/chatbot [your question]\` to ask me anything\n• Mention me with \`@ChatBot\` in any channel\n• I support sentiment analysis and can escalate to humans when needed\n• I can respond in English and Spanish`
        });
        break;

      default:
        res.json({
          response_type: 'ephemeral',
          text: 'Unknown command. Use `/chatbot-help` for assistance.'
        });
    }
  } catch (error) {
    console.error('Slack slash command error:', error);
    res.status(500).json({
      response_type: 'ephemeral',
      text: 'Sorry, I encountered an error processing your request.'
    });
  }
});

// Slack interactive components (buttons, menus, etc.)
router.post('/interactive', async (req, res) => {
  if (!isSlackEnabled) {
    return res.status(503).send('Slack integration is not configured');
  }

  try {
    console.log('🔘 Slack interactive request received');
    console.log('Raw body:', req.body);

    const payload = JSON.parse(req.body.payload);
    console.log('📦 Parsed payload:', JSON.stringify(payload, null, 2));

    if (payload.type === 'block_actions') {
      await handleSlackInteraction(payload);
    }

    // Slack expects a 200 response quickly
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Slack interactive error:', error);
    res.status(200).send('Error processing request');
  }
});

async function handleSlackMessage(event, isMention = false) {
  try {
    const userId = event.user;
    const channelId = event.channel;
    const messageText = event.text;

    // Remove bot mention from message if it's a mention
    let cleanText = messageText;
    if (isMention) {
      cleanText = messageText.replace(/<@[A-Z0-9]+>/g, '').trim();
    }

    // Sanitize input
    const sanitizedMessage = sanitizeInput(cleanText);

    console.log(`Slack message from ${userId} in ${channelId}: ${sanitizedMessage}`);

    // Process with AI
    const response = await handleChatMessage({
      userId: `slack_${userId}`,
      message: sanitizedMessage,
      language: 'en', // Could detect language here
      channel: 'slack',
      metadata: {
        slackUserId: userId,
        channelId: channelId,
        platform: 'slack'
      }
    });

    // Send response back to Slack
    await sendSlackMessage(channelId, response.message, {
      sentiment: response.sentiment,
      escalated: response.escalated
    });

    // Handle escalation
    if (response.escalated) {
      await sendSlackEscalationNotification(channelId, userId, sanitizedMessage);
    }

  } catch (error) {
    console.error('Error handling Slack message:', error);
    await sendSlackMessage(
      event.channel,
      'Sorry, I encountered an error. Please try again later.'
    );
  }
}

async function handleSlackSlashCommand(text, userId, channelId, userName) {
  try {
    if (!text || text.trim() === '') {
      await sendSlackMessage(channelId, 'Please provide a question or message after the command.');
      return;
    }

    const sanitizedMessage = sanitizeInput(text);

    // Process with AI
    const response = await handleChatMessage({
      userId: `slack_${userId}`,
      message: sanitizedMessage,
      language: 'en',
      channel: 'slack',
      metadata: {
        slackUserId: userId,
        channelId: channelId,
        userName: userName,
        platform: 'slack'
      }
    });

    // Send response
    await sendSlackMessage(channelId, response.message, {
      sentiment: response.sentiment,
      escalated: response.escalated,
      userName: userName
    });

    // Handle escalation
    if (response.escalated) {
      await sendSlackEscalationNotification(channelId, userId, sanitizedMessage);
    }

  } catch (error) {
    console.error('Error handling Slack slash command:', error);
    await sendSlackMessage(
      channelId,
      'Sorry, I encountered an error processing your request.'
    );
  }
}

async function sendSlackMessage(channel, text, options = {}) {
  if (!isSlackEnabled || !slack) {
    console.log('⚠️ Slack not enabled - message not sent:', text);
    return;
  }

  try {
    const { sentiment, escalated } = options;

    // First, try to find the channel if it's a name
    let channelId = channel;
    if (!channel.startsWith('C') && !channel.startsWith('D')) {
      try {
        const channelsList = await slack.conversations.list({
          types: 'public_channel,private_channel'
        });

        const foundChannel = channelsList.channels.find(ch =>
          ch.name === channel || ch.name === channel.replace('#', '')
        );

        if (foundChannel) {
          channelId = foundChannel.id;
        } else {
          console.warn(`Channel '${channel}' not found, trying direct message to bot`);
          // Try to send as DM to the bot user instead
          channelId = process.env.SLACK_BOT_USER_ID;
        }
      } catch (error) {
        console.warn(`Error finding channel '${channel}':`, error.message);
        // Fallback to original channel name
        channelId = channel;
      }
    }

    // Create blocks for rich formatting
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: text
        }
      }
    ];

    // Add sentiment indicator
    if (sentiment) {
      const sentimentEmoji = {
        positive: '😊',
        negative: '😔',
        neutral: '😐'
      };

      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${sentimentEmoji[sentiment]} Sentiment: ${sentiment}`
          }
        ]
      });
    }

    // Add escalation notice
    if (escalated) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '🚨 *This conversation has been escalated to a human agent.*'
        }
      });
    }

    // Add action buttons
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '👍 Helpful'
          },
          action_id: 'feedback_positive',
          style: 'primary'
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '👎 Not Helpful'
          },
          action_id: 'feedback_negative'
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '🙋 Need Human'
          },
          action_id: 'request_human',
          style: 'danger'
        }
      ]
    });

    await slack.chat.postMessage({
      channel: channelId,
      blocks: blocks,
      text: text // Fallback text for notifications
    });

    console.log(`Slack message sent to ${channelId} (${channel}): ${text}`);
  } catch (error) {
    console.error('Error sending Slack message:', error);
  }
}

async function sendSlackEscalationNotification(channelId, userId, originalMessage, userChannel = 'web') {
  try {
    // Send to escalation channel
    const escalationChannel = process.env.SLACK_ESCALATION_CHANNEL || 'escalations';

    // Create a unique thread ID for this escalation
    const escalationId = `escalation_${Date.now()}_${userId.replace(/[^a-zA-Z0-9]/g, '')}`;

    const escalationMessage = await slack.chat.postMessage({
      channel: escalationChannel,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Human Escalation Request'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*User ID:* ${userId}`
            },
            {
              type: 'mrkdwn',
              text: `*Channel:* ${userChannel}`
            },
            {
              type: 'mrkdwn',
              text: `*Time:* ${new Date().toLocaleString()}`
            },
            {
              type: 'mrkdwn',
              text: `*Escalation ID:* ${escalationId}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*User's Message:*\n> ${originalMessage}`
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*🎯 How to respond:*\n• Reply in this thread to send message to user\n• Use buttons below for quick actions\n• User will see your responses in real-time`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '✅ Take Over Conversation'
              },
              action_id: 'agent_takeover',
              value: escalationId,
              style: 'primary'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📞 Schedule Call'
              },
              action_id: 'schedule_call',
              value: escalationId
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '✅ Resolved'
              },
              action_id: 'mark_resolved',
              value: escalationId,
              style: 'danger'
            }
          ]
        }
      ],
      metadata: {
        event_type: 'escalation',
        event_payload: {
          escalation_id: escalationId,
          user_id: userId,
          user_channel: userChannel,
          original_message: originalMessage
        }
      }
    });

    // Store escalation mapping for responses
    await storeEscalationMapping(escalationId, userId, userChannel, escalationMessage.ts);

    return escalationId;
  } catch (error) {
    console.error('Error sending Slack escalation notification:', error);
    return null;
  }
}

async function handleSlackInteraction(payload) {
  try {
    const action = payload.actions[0];
    const user = payload.user;
    const channel = payload.channel;
    const escalationId = action.value; // This contains the escalation ID

    console.log('🔘 Handling interaction:', {
      action_id: action.action_id,
      user: user.name,
      escalation_id: escalationId
    });

    switch (action.action_id) {
      case 'agent_takeover':
        // Mark escalation as taken over
        const escalation = escalationMappings.get(escalationId);
        if (escalation) {
          escalation.status = 'taken_over';
          escalation.agent = user.name;
          escalationMappings.set(escalationId, escalation);
        }

        // Update the original message to show takeover
        await slack.chat.update({
          channel: channel.id,
          ts: payload.message.ts,
          blocks: [
            ...payload.message.blocks.slice(0, -1), // Keep all blocks except the last (actions)
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `✅ *Conversation taken over by <@${user.id}>*\n\n*Next steps:*\n• Reply in this thread to send messages to the user\n• User will see your responses in real-time`
              }
            }
          ]
        });

        // Send confirmation to user
        if (escalation) {
          await sendAdminResponseToUser(
            escalation,
            `Hello! I'm ${user.real_name || user.name} from support. I'm here to help you. How can I assist you today?`,
            user.real_name || user.name
          );
        }

        console.log('✅ Agent takeover completed');
        break;

      case 'schedule_call':
        await slack.chat.postEphemeral({
          channel: channel.id,
          user: user.id,
          text: '📞 Call scheduling feature coming soon! For now, please respond in this thread to help the user.'
        });
        break;

      case 'mark_resolved':
        // Mark escalation as resolved
        const resolvedEscalation = escalationMappings.get(escalationId);
        if (resolvedEscalation) {
          resolvedEscalation.status = 'resolved';
          resolvedEscalation.resolved_by = user.name;
          resolvedEscalation.resolved_at = new Date().toISOString();
          escalationMappings.set(escalationId, resolvedEscalation);
        }

        // Update the original message
        await slack.chat.update({
          channel: channel.id,
          ts: payload.message.ts,
          blocks: [
            ...payload.message.blocks.slice(0, -1), // Keep all blocks except actions
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `✅ *Escalation resolved by <@${user.id}>*\n\nResolved at: ${new Date().toLocaleString()}`
              }
            }
          ]
        });

        console.log('✅ Escalation marked as resolved');
        break;

      // Legacy handlers (keep for compatibility)
      case 'feedback_positive':
        await slack.chat.postEphemeral({
          channel: channel.id,
          user: user.id,
          text: '👍 Thank you for your feedback! I\'m glad I could help.'
        });
        break;

      case 'feedback_negative':
        await slack.chat.postEphemeral({
          channel: channel.id,
          user: user.id,
          text: '👎 I\'m sorry I couldn\'t help better. A human agent will be notified.'
        });
        await sendSlackEscalationNotification(channel.id, user.id, 'User reported unhelpful response');
        break;

      case 'request_human':
        await slack.chat.postEphemeral({
          channel: channel.id,
          user: user.id,
          text: '🙋 I\'ve notified a human agent. They will assist you shortly.'
        });
        await sendSlackEscalationNotification(channel.id, user.id, 'User requested human assistance');
        break;

      default:
        console.warn('Unknown action:', action.action_id);
    }
  } catch (error) {
    console.error('❌ Error handling Slack interaction:', error);
  }
}

function verifySlackRequest(req) {
  // For now, just check if the request has the expected structure
  // In production, implement proper Slack request verification
  // using the signing secret and timestamp

  if (req.body && req.body.payload) {
    try {
      const payload = JSON.parse(req.body.payload);
      return payload.team && payload.user;
    } catch (e) {
      return false;
    }
  }

  return req.body && (req.body.command || req.body.user_id);
}

// Get available channels for testing
async function getAvailableChannels() {
  try {
    const result = await slack.conversations.list({
      types: 'public_channel,private_channel',
      limit: 100
    });

    return result.channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      is_member: channel.is_member,
      is_private: channel.is_private
    }));
  } catch (error) {
    console.error('Error getting Slack channels:', error);
    return [];
  }
}

// Find a suitable test channel
async function findTestChannel() {
  try {
    const channels = await getAvailableChannels();

    // Look for common test channels first
    const testChannelNames = ['test', 'testing', 'bot-test', 'general', 'random'];

    for (const testName of testChannelNames) {
      const channel = channels.find(ch =>
        ch.name === testName && ch.is_member && !ch.is_private
      );
      if (channel) {
        return channel;
      }
    }

    // If no test channels found, use the first public channel the bot is a member of
    const publicChannel = channels.find(ch => ch.is_member && !ch.is_private);
    if (publicChannel) {
      return publicChannel;
    }

    // Last resort: try to create a DM with the bot
    return {
      id: process.env.SLACK_BOT_USER_ID,
      name: 'bot-dm',
      is_member: true,
      is_private: true
    };

  } catch (error) {
    console.error('Error finding test channel:', error);
    return null;
  }
}

// Debug endpoint to test Slack connection
router.get('/test', async (req, res) => {
  if (!isSlackEnabled) {
    return res.json({
      success: false,
      error: 'Slack integration not enabled',
      config: {
        SLACK_BOT_TOKEN: !!process.env.SLACK_BOT_TOKEN,
        SLACK_SIGNING_SECRET: !!process.env.SLACK_SIGNING_SECRET,
        SLACK_BOT_USER_ID: !!process.env.SLACK_BOT_USER_ID,
        SLACK_ESCALATION_CHANNEL: process.env.SLACK_ESCALATION_CHANNEL || 'not set'
      }
    });
  }

  try {
    // Test Slack API connection
    const authTest = await slack.auth.test();

    // Test sending message to escalation channel
    const testChannel = process.env.SLACK_ESCALATION_CHANNEL || 'escalations';
    const testMessage = await slack.chat.postMessage({
      channel: testChannel,
      text: '🧪 Test message from AI Chatbot - Escalation system is working!',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '🧪 *Test Message*\n\nThis is a test message to verify the escalation system is working correctly.'
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Sent at ${new Date().toLocaleString()}`
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      slack_auth: {
        user: authTest.user,
        team: authTest.team,
        user_id: authTest.user_id
      },
      test_message: {
        channel: testMessage.channel,
        timestamp: testMessage.ts,
        message: 'Test message sent successfully'
      },
      config: {
        escalation_channel: testChannel,
        bot_enabled: true
      }
    });

  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      config: {
        SLACK_BOT_TOKEN: !!process.env.SLACK_BOT_TOKEN,
        SLACK_SIGNING_SECRET: !!process.env.SLACK_SIGNING_SECRET,
        SLACK_BOT_USER_ID: !!process.env.SLACK_BOT_USER_ID,
        SLACK_ESCALATION_CHANNEL: process.env.SLACK_ESCALATION_CHANNEL || 'not set'
      }
    });
  }
});

// Mount the events adapter (only if Slack is enabled)
if (slackEvents) {
  router.use('/events', slackEvents.expressMiddleware());
} else {
  router.use('/events', (req, res) => {
    res.status(503).json({ error: 'Slack integration not configured' });
  });
}

module.exports = {
  router,
  slack,
  sendSlackMessage,
  sendSlackEscalationNotification,
  getAvailableChannels,
  findTestChannel,
  setSocketIOInstance
};
