const express = require('express');
const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');
const { handleChatMessage } = require('../services/chatService');
const { sanitizeInput } = require('../utils/helpers');

const router = express.Router();

// Initialize Slack Web API client
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// Initialize Slack Events API adapter
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);

// Slack event handlers
slackEvents.on('message', async (event) => {
  try {
    // Ignore bot messages and messages in threads (for now)
    if (event.bot_id || event.thread_ts) {
      return;
    }

    // Ignore messages from our own bot
    if (event.user === process.env.SLACK_BOT_USER_ID) {
      return;
    }

    await handleSlackMessage(event);
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

// Slack slash commands
router.post('/commands', async (req, res) => {
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
  try {
    const payload = JSON.parse(req.body.payload);
    
    if (payload.type === 'block_actions') {
      await handleSlackInteraction(payload);
    }

    res.status(200).send();
  } catch (error) {
    console.error('Slack interactive error:', error);
    res.status(500).send('Error');
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
  try {
    const { sentiment, escalated, userName } = options;

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

async function sendSlackEscalationNotification(channelId, userId, originalMessage) {
  try {
    // Send to escalation channel
    const escalationChannel = process.env.SLACK_ESCALATION_CHANNEL || channelId;
    
    await slack.chat.postMessage({
      channel: escalationChannel,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Chatbot Escalation Alert'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*User:* <@${userId}>`
            },
            {
              type: 'mrkdwn',
              text: `*Channel:* <#${channelId}>`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Original Message:*\n${originalMessage}`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '✅ Take Over'
              },
              action_id: 'agent_takeover',
              style: 'primary'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📞 Schedule Call'
              },
              action_id: 'schedule_call'
            }
          ]
        }
      ]
    });
  } catch (error) {
    console.error('Error sending Slack escalation notification:', error);
  }
}

async function handleSlackInteraction(payload) {
  try {
    const action = payload.actions[0];
    const user = payload.user;
    const channel = payload.channel;

    switch (action.action_id) {
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
        // Trigger escalation
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

      case 'agent_takeover':
        await slack.chat.postMessage({
          channel: channel.id,
          text: `🙋‍♂️ <@${user.id}> is now handling this conversation.`
        });
        break;
    }
  } catch (error) {
    console.error('Error handling Slack interaction:', error);
  }
}

function verifySlackRequest(req) {
  // In production, implement proper Slack request verification
  // using the signing secret and timestamp
  return true; // Simplified for demo
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

// Mount the events adapter
router.use('/events', slackEvents.expressMiddleware());

module.exports = {
  router,
  slack,
  sendSlackMessage,
  sendSlackEscalationNotification,
  getAvailableChannels,
  findTestChannel
};
