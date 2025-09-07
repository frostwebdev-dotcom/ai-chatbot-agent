#!/usr/bin/env node

/**
 * Multi-Channel Testing Script
 * Tests all channel integrations to ensure they're working properly
 */

require('dotenv').config();
const { channelManager } = require('../services/channelManager');

async function testChannels() {
  console.log('🧪 Starting Multi-Channel Tests...\n');

  const testMessage = 'Hello! This is a test message from the AI chatbot.';
  const testOptions = {
    sentiment: 'positive',
    escalated: false
  };

  // Test results
  const results = {
    web: { status: 'pending', error: null },
    mobile: { status: 'pending', error: null },
    whatsapp: { status: 'pending', error: null },
    slack: { status: 'pending', error: null }
  };

  console.log('📊 Channel Capabilities:');
  console.log(JSON.stringify(channelManager.getChannelStats(), null, 2));
  console.log('\n');

  // Test Web Channel
  console.log('🌐 Testing Web Channel...');
  try {
    await channelManager.sendResponse('web', 'test_user_web', testMessage, testOptions);
    results.web.status = 'success';
    console.log('✅ Web channel test passed\n');
  } catch (error) {
    results.web.status = 'failed';
    results.web.error = error.message;
    console.log(`❌ Web channel test failed: ${error.message}\n`);
  }

  // Test Mobile Channel
  console.log('📱 Testing Mobile Channel...');
  try {
    await channelManager.sendResponse('mobile', 'test_user_mobile', testMessage, testOptions);
    results.mobile.status = 'success';
    console.log('✅ Mobile channel test passed\n');
  } catch (error) {
    results.mobile.status = 'failed';
    results.mobile.error = error.message;
    console.log(`❌ Mobile channel test failed: ${error.message}\n`);
  }

  // Test WhatsApp Channel
  console.log('💬 Testing WhatsApp Channel...');
  if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    try {
      // Use a test phone number (replace with your test number)
      const testPhoneNumber = process.env.TEST_WHATSAPP_NUMBER || '+1234567890';
      await channelManager.sendResponse('whatsapp', testPhoneNumber, testMessage, testOptions);
      results.whatsapp.status = 'success';
      console.log('✅ WhatsApp channel test passed\n');
    } catch (error) {
      results.whatsapp.status = 'failed';
      results.whatsapp.error = error.message;
      console.log(`❌ WhatsApp channel test failed: ${error.message}\n`);
    }
  } else {
    results.whatsapp.status = 'skipped';
    results.whatsapp.error = 'WhatsApp credentials not configured';
    console.log('⏭️ WhatsApp channel test skipped (credentials not configured)\n');
  }

  // Test Slack Channel
  console.log('💼 Testing Slack Channel...');
  if (process.env.SLACK_BOT_TOKEN) {
    try {
      // Import Slack integration to find available channels
      const { findTestChannel, getAvailableChannels } = require('../integrations/slack');

      console.log('   🔍 Finding available Slack channels...');
      const availableChannels = await getAvailableChannels();
      console.log(`   📋 Found ${availableChannels.length} channels`);

      if (availableChannels.length > 0) {
        console.log('   📝 Available channels:');
        availableChannels.slice(0, 5).forEach(ch => {
          console.log(`      • #${ch.name} (${ch.is_member ? 'member' : 'not member'}, ${ch.is_private ? 'private' : 'public'})`);
        });
        if (availableChannels.length > 5) {
          console.log(`      ... and ${availableChannels.length - 5} more`);
        }
      }

      const testChannel = await findTestChannel();
      if (testChannel) {
        console.log(`   🎯 Using test channel: #${testChannel.name} (${testChannel.id})`);
        await channelManager.sendResponse('slack', testChannel.id, testMessage, testOptions);
        results.slack.status = 'success';
        console.log('✅ Slack channel test passed\n');
      } else {
        results.slack.status = 'failed';
        results.slack.error = 'No suitable test channel found. Bot needs to be added to a channel.';
        console.log('❌ Slack channel test failed: No suitable test channel found\n');
        console.log('   💡 Tip: Invite your bot to a channel with: /invite @YourBot\n');
      }
    } catch (error) {
      results.slack.status = 'failed';
      results.slack.error = error.message;
      console.log(`❌ Slack channel test failed: ${error.message}\n`);
    }
  } else {
    results.slack.status = 'skipped';
    results.slack.error = 'Slack credentials not configured';
    console.log('⏭️ Slack channel test skipped (credentials not configured)\n');
  }

  // Test Message Formatting
  console.log('🎨 Testing Message Formatting...');
  const channels = ['web', 'mobile', 'whatsapp', 'slack'];
  channels.forEach(channel => {
    const formatted = channelManager.formatMessage(channel, testMessage, testOptions);
    console.log(`${channel}: "${formatted}"`);
  });
  console.log('\n');

  // Test User ID Generation
  console.log('🆔 Testing User ID Generation...');
  const testIdentifiers = ['user123', 'phone456', 'slack789'];
  channels.forEach(channel => {
    testIdentifiers.forEach(identifier => {
      const userId = channelManager.getUserId(channel, identifier);
      const detectedChannel = channelManager.getChannelFromUserId(userId);
      console.log(`${channel} + ${identifier} = ${userId} (detected: ${detectedChannel})`);
    });
  });
  console.log('\n');

  // Test Message Validation
  console.log('✅ Testing Message Validation...');
  const longMessage = 'A'.repeat(5000);
  channels.forEach(channel => {
    try {
      channelManager.validateMessage(channel, longMessage);
      console.log(`${channel}: Long message validation passed`);
    } catch (error) {
      console.log(`${channel}: Long message validation failed - ${error.message}`);
    }
  });
  console.log('\n');

  // Print Final Results
  console.log('📋 Test Results Summary:');
  console.log('========================');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;

  Object.entries(results).forEach(([channel, result]) => {
    totalTests++;
    const icon = result.status === 'success' ? '✅' : 
                 result.status === 'failed' ? '❌' : '⏭️';
    
    console.log(`${icon} ${channel.toUpperCase()}: ${result.status.toUpperCase()}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    if (result.status === 'success') passedTests++;
    else if (result.status === 'failed') failedTests++;
    else skippedTests++;
  });

  console.log('\n📊 Statistics:');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Skipped: ${skippedTests}`);
  
  const successRate = totalTests > 0 ? ((passedTests / (totalTests - skippedTests)) * 100).toFixed(1) : 0;
  console.log(`Success Rate: ${successRate}%`);

  // Configuration Check
  console.log('\n⚙️ Configuration Check:');
  console.log('=======================');
  
  const requiredEnvVars = {
    'OpenAI': ['OPENAI_API_KEY'],
    'Firebase': ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'],
    'WhatsApp': ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_VERIFY_TOKEN'],
    'Slack': ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET'],
    'Email': ['EMAIL_USER', 'EMAIL_PASS']
  };

  Object.entries(requiredEnvVars).forEach(([service, vars]) => {
    const configured = vars.every(varName => process.env[varName]);
    const icon = configured ? '✅' : '❌';
    console.log(`${icon} ${service}: ${configured ? 'Configured' : 'Missing variables'}`);
    
    if (!configured) {
      const missing = vars.filter(varName => !process.env[varName]);
      console.log(`   Missing: ${missing.join(', ')}`);
    }
  });

  console.log('\n🎯 Next Steps:');
  console.log('==============');
  
  if (failedTests > 0) {
    console.log('1. Fix failed channel configurations');
    console.log('2. Check API credentials and permissions');
    console.log('3. Verify network connectivity');
  }
  
  if (skippedTests > 0) {
    console.log('1. Configure missing environment variables');
    console.log('2. Set up API accounts for skipped channels');
    console.log('3. Re-run tests after configuration');
  }
  
  if (passedTests === totalTests - skippedTests) {
    console.log('🎉 All configured channels are working properly!');
    console.log('🚀 Your multi-channel chatbot is ready to use!');
  }

  console.log('\n📚 Documentation:');
  console.log('==================');
  console.log('• Setup Guide: MULTI_CHANNEL_SETUP.md');
  console.log('• API Documentation: /api/docs (when server is running)');
  console.log('• Channel Status: GET /api/chat/channel-stats');

  process.exit(failedTests > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run tests
if (require.main === module) {
  testChannels().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testChannels };
