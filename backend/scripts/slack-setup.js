#!/usr/bin/env node

/**
 * Slack Setup Helper Script
 * Helps diagnose and set up Slack integration
 */

require('dotenv').config();
const { slack, getAvailableChannels, findTestChannel } = require('../integrations/slack');

async function slackSetup() {
  console.log('🔧 Slack Integration Setup Helper\n');

  // Check environment variables
  console.log('📋 Environment Variables Check:');
  console.log('================================');
  
  const requiredVars = [
    'SLACK_BOT_TOKEN',
    'SLACK_SIGNING_SECRET',
    'SLACK_BOT_USER_ID'
  ];

  const optionalVars = [
    'SLACK_ESCALATION_CHANNEL',
    'TEST_SLACK_CHANNEL'
  ];

  let allConfigured = true;

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    const configured = !!value;
    const icon = configured ? '✅' : '❌';
    console.log(`${icon} ${varName}: ${configured ? 'Configured' : 'Missing'}`);
    if (configured && varName === 'SLACK_BOT_TOKEN') {
      console.log(`   Token starts with: ${value.substring(0, 10)}...`);
    }
    if (!configured) allConfigured = false;
  });

  console.log('\nOptional Variables:');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    const configured = !!value;
    const icon = configured ? '✅' : '⚠️';
    console.log(`${icon} ${varName}: ${configured ? value : 'Not set (will use defaults)'}`);
  });

  if (!allConfigured) {
    console.log('\n❌ Missing required environment variables!');
    console.log('\n📚 Setup Instructions:');
    console.log('======================');
    console.log('1. Go to https://api.slack.com/apps');
    console.log('2. Create a new app or select existing app');
    console.log('3. Go to "OAuth & Permissions" and copy "Bot User OAuth Token"');
    console.log('4. Go to "Basic Information" and copy "Signing Secret"');
    console.log('5. Go to "App Home" and copy "App ID" (Bot User ID)');
    console.log('6. Add these to your .env file:');
    console.log('   SLACK_BOT_TOKEN=xoxb-your-token-here');
    console.log('   SLACK_SIGNING_SECRET=your-signing-secret');
    console.log('   SLACK_BOT_USER_ID=your-bot-user-id');
    return;
  }

  // Test API connection
  console.log('\n🔌 Testing Slack API Connection:');
  console.log('=================================');
  
  try {
    const authTest = await slack.auth.test();
    console.log('✅ API Connection successful!');
    console.log(`   Bot Name: ${authTest.user}`);
    console.log(`   Team: ${authTest.team}`);
    console.log(`   User ID: ${authTest.user_id}`);
    console.log(`   Bot ID: ${authTest.bot_id}`);
  } catch (error) {
    console.log('❌ API Connection failed!');
    console.log(`   Error: ${error.message}`);
    console.log('\n💡 Troubleshooting:');
    console.log('   • Check if SLACK_BOT_TOKEN is correct');
    console.log('   • Ensure the token starts with "xoxb-"');
    console.log('   • Verify the app is installed in your workspace');
    return;
  }

  // Get bot info
  console.log('\n🤖 Bot Information:');
  console.log('===================');
  
  try {
    const botInfo = await slack.bots.info({
      bot: process.env.SLACK_BOT_USER_ID
    });
    
    if (botInfo.ok) {
      console.log(`✅ Bot Name: ${botInfo.bot.name}`);
      console.log(`   App ID: ${botInfo.bot.app_id}`);
      console.log(`   User ID: ${botInfo.bot.user_id}`);
    }
  } catch (error) {
    console.log('⚠️ Could not get bot info (this is usually fine)');
  }

  // List available channels
  console.log('\n📋 Available Channels:');
  console.log('======================');
  
  try {
    const channels = await getAvailableChannels();
    
    if (channels.length === 0) {
      console.log('❌ No channels found!');
      console.log('\n💡 Your bot needs to be added to channels:');
      console.log('   1. Go to a Slack channel');
      console.log('   2. Type: /invite @YourBotName');
      console.log('   3. Or go to channel settings → Integrations → Add apps');
    } else {
      console.log(`✅ Found ${channels.length} channels:`);
      
      const publicChannels = channels.filter(ch => !ch.is_private && ch.is_member);
      const privateChannels = channels.filter(ch => ch.is_private && ch.is_member);
      const notMemberChannels = channels.filter(ch => !ch.is_member);
      
      if (publicChannels.length > 0) {
        console.log('\n   📢 Public channels (bot is member):');
        publicChannels.forEach(ch => {
          console.log(`      • #${ch.name} (${ch.id})`);
        });
      }
      
      if (privateChannels.length > 0) {
        console.log('\n   🔒 Private channels (bot is member):');
        privateChannels.forEach(ch => {
          console.log(`      • #${ch.name} (${ch.id})`);
        });
      }
      
      if (notMemberChannels.length > 0) {
        console.log('\n   ⚠️ Channels where bot is NOT a member:');
        notMemberChannels.slice(0, 5).forEach(ch => {
          console.log(`      • #${ch.name} (invite bot to use)`);
        });
        if (notMemberChannels.length > 5) {
          console.log(`      ... and ${notMemberChannels.length - 5} more`);
        }
      }
    }
  } catch (error) {
    console.log('❌ Error getting channels:', error.message);
  }

  // Find test channel
  console.log('\n🎯 Test Channel Selection:');
  console.log('==========================');
  
  try {
    const testChannel = await findTestChannel();
    
    if (testChannel) {
      console.log(`✅ Recommended test channel: #${testChannel.name}`);
      console.log(`   Channel ID: ${testChannel.id}`);
      console.log(`   Type: ${testChannel.is_private ? 'Private' : 'Public'}`);
      
      // Test sending a message
      console.log('\n📤 Testing message sending...');
      try {
        await slack.chat.postMessage({
          channel: testChannel.id,
          text: '🧪 Test message from AI Chatbot setup script!',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '🧪 *Test Message*\n\nThis is a test message from the AI Chatbot setup script. If you can see this, the integration is working correctly!'
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
        
        console.log('✅ Test message sent successfully!');
        console.log(`   Check #${testChannel.name} channel for the test message`);
      } catch (error) {
        console.log('❌ Failed to send test message:', error.message);
      }
    } else {
      console.log('❌ No suitable test channel found');
      console.log('\n💡 To fix this:');
      console.log('   1. Create a #test or #bot-test channel');
      console.log('   2. Invite your bot: /invite @YourBotName');
      console.log('   3. Run this script again');
    }
  } catch (error) {
    console.log('❌ Error finding test channel:', error.message);
  }

  // Permissions check
  console.log('\n🔐 Permissions Check:');
  console.log('=====================');
  
  const requiredScopes = [
    'chat:write',
    'channels:read',
    'groups:read',
    'users:read',
    'commands'
  ];

  try {
    const authTest = await slack.auth.test();
    console.log('✅ Bot has basic permissions');
    console.log('\n💡 Required OAuth scopes for full functionality:');
    requiredScopes.forEach(scope => {
      console.log(`   • ${scope}`);
    });
    console.log('\n   To add scopes:');
    console.log('   1. Go to your app settings → OAuth & Permissions');
    console.log('   2. Add the required scopes');
    console.log('   3. Reinstall the app to your workspace');
  } catch (error) {
    console.log('❌ Permission check failed:', error.message);
  }

  // Final recommendations
  console.log('\n🎯 Next Steps:');
  console.log('==============');
  console.log('1. ✅ Environment variables are configured');
  console.log('2. ✅ API connection is working');
  
  if (channels && channels.some(ch => ch.is_member)) {
    console.log('3. ✅ Bot is added to channels');
    console.log('4. 🚀 Ready to test! Run: node scripts/test-channels.js');
  } else {
    console.log('3. ❌ Add bot to channels (see instructions above)');
    console.log('4. ⏳ Run this script again after adding bot to channels');
  }

  console.log('\n📚 Useful Commands:');
  console.log('===================');
  console.log('• Test integration: node scripts/test-channels.js');
  console.log('• In Slack: /chatbot Hello world');
  console.log('• In Slack: @YourBot What can you do?');
  console.log('• Get help: /chatbot-help');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run setup
if (require.main === module) {
  slackSetup().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { slackSetup };
