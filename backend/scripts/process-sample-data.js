const { MongoClient } = require('mongodb');
require('dotenv').config();

// Sample data from the provided JSON files
const samplePayloads = [
  // Conversation 1 - Message 1 (User message)
  {
    "payload_type": "whatsapp_webhook",
    "_id": "conv1-msg1-user",
    "metaData": {
      "entry": [{
        "changes": [{
          "field": "messages",
          "value": {
            "contacts": [{
              "profile": { "name": "Ravi Kumar" },
              "wa_id": "919937320320"
            }],
            "messages": [{
              "from": "919937320320",
              "id": "wamid.HBgMOTE5OTY3NTc4NzIwFQIAEhggMTIzQURFRjEyMzQ1Njc4OTA=",
              "timestamp": "1754400000",
              "text": { "body": "Hi, I'd like to know more about your services." },
              "type": "text"
            }],
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "918329446654",
              "phone_number_id": "629305560276479"
            }
          }
        }]
      }]
    },
    "createdAt": "2025-08-06 12:00:00"
  },

  // Conversation 1 - Message 2 (API response)
  {
    "payload_type": "whatsapp_webhook",
    "_id": "conv1-msg2-api",
    "metaData": {
      "entry": [{
        "changes": [{
          "field": "messages",
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "918329446654",
              "phone_number_id": "629305560276479"
            },
            "contacts": [{
              "profile": { "name": "Ravi Kumar" },
              "wa_id": "919937320320"
            }],
            "messages": [{
              "from": "918329446654",
              "id": "wamid.HBgMOTE5OTY3NTc4NzIwFQIAEhggNDc4NzZBQ0YxMjdCQ0VFOTk2NzA3MTI4RkZCNjYyMjc=",
              "timestamp": "1754400020",
              "text": { "body": "Hi Ravi! Sure, I'd be happy to help you with that. Could you tell me what you're looking for?" },
              "type": "text"
            }]
          }
        }]
      }]
    },
    "createdAt": "2025-08-06 12:00:20"
  },

  // Conversation 2 - Message 1 (User message)
  {
    "payload_type": "whatsapp_webhook",
    "_id": "conv2-msg1-user",
    "metaData": {
      "entry": [{
        "changes": [{
          "field": "messages",
          "value": {
            "contacts": [{
              "profile": { "name": "Neha Joshi" },
              "wa_id": "929967673820"
            }],
            "messages": [{
              "from": "929967673820",
              "id": "wamid.HBgMOTI5OTY3NjczODIwFQIAEhggQ0FBQkNERUYwMDFGRjEyMzQ1NkZGQTk5RTJCM0I2NzY=",
              "timestamp": "1754401000",
              "text": { "body": "Hi, I saw your ad. Can you share more details?" },
              "type": "text"
            }],
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "918329446654",
              "phone_number_id": "629305560276479"
            }
          }
        }]
      }]
    },
    "createdAt": "2025-08-06 12:16:40"
  },

  // Conversation 2 - Message 2 (API response)
  {
    "payload_type": "whatsapp_webhook",
    "_id": "conv2-msg2-api",
    "metaData": {
      "entry": [{
        "changes": [{
          "field": "messages",
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "918329446654",
              "phone_number_id": "629305560276479"
            },
            "contacts": [{
              "profile": { "name": "Neha Joshi" },
              "wa_id": "929967673820"
            }],
            "messages": [{
              "from": "918329446654",
              "id": "wamid.HBgMOTI5OTY3NjczODIwFQIAEhggM0RFNDkxRjEwNDhDQzgwMzk3NzA1ODc1RkU3QzI0MzU=",
              "timestamp": "1754401030",
              "text": { "body": "Hi Neha! Absolutely. We offer curated home decor pieces—are you looking for nameplates, wall art, or something else?" },
              "type": "text"
            }]
          }
        }]
      }]
    },
    "createdAt": "2025-08-06 12:17:10"
  }
];

// Status update payloads
const statusPayloads = [
  {
    "payload_type": "whatsapp_webhook",
    "_id": "conv1-msg2-status",
    "metaData": {
      "entry": [{
        "changes": [{
          "field": "messages",
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "918329446654",
              "phone_number_id": "629305560276479"
            },
            "statuses": [{
              "conversation": {
                "id": "conv1-convo-id",
                "origin": { "type": "user_initiated" }
              },
              "gs_id": "conv1-msg2-gs-id",
              "id": "wamid.HBgMOTE5OTY3NTc4NzIwFQIAEhggNDc4NzZBQ0YxMjdCQ0VFOTk2NzA3MTI4RkZCNjYyMjc=",
              "meta_msg_id": "wamid.HBgMOTE5OTY3NTc4NzIwFQIAEhggNDc4NzZBQ0YxMjdCQ0VFOTk2NzA3MTI4RkZCNjYyMjc=",
              "recipient_id": "919937320320",
              "status": "read",
              "timestamp": "1754400040"
            }]
          }
        }]
      }]
    }
  },
  {
    "payload_type": "whatsapp_webhook",
    "_id": "conv2-msg2-status",
    "metaData": {
      "entry": [{
        "changes": [{
          "field": "messages",
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "918329446654",
              "phone_number_id": "629305560276479"
            },
            "statuses": [{
              "conversation": {
                "id": "conv2-convo-id",
                "origin": { "type": "user_initiated" }
              },
              "gs_id": "conv2-msg2-gs-id",
              "id": "wamid.HBgMOTI5OTY3NjczODIwFQIAEhggM0RFNDkxRjEwNDhDQzgwMzk3NzA1ODc1RkU3QzI0MzU=",
              "meta_msg_id": "wamid.HBgMOTI5OTY3NjczODIwFQIAEhggM0RFNDkxRjEwNDhDQzgwMzk3NzA1ODc1RkU3QzI0MzU=",
              "pricing": {
                "billable": true,
                "category": "utility",
                "pricing_model": "PMP",
                "type": "regular"
              },
              "recipient_id": "929967673820",
              "status": "delivered",
              "timestamp": "1754401045"
            }]
          }
        }]
      }]
    }
  }
];

// Helper function to process webhook payload (same as in server.js)
function processWebhookPayload(payload) {
  try {
    const { metaData } = payload;
    
    if (!metaData || !metaData.entry || !metaData.entry[0]) {
      return null;
    }
    
    const changes = metaData.entry[0].changes[0];
    const value = changes.value;
    
    if (changes.field === 'messages') {
      if (value.messages && value.messages.length > 0) {
        // Process incoming message
        const message = value.messages[0];
        const contact = value.contacts && value.contacts.length > 0 ? value.contacts[0] : null;
        
        return {
          type: 'message',
          data: {
            messageId: message.id,
            from: message.from,
            to: value.metadata.display_phone_number,
            timestamp: parseInt(message.timestamp),
            text: message.text ? message.text.body : '',
            messageType: message.type,
            contactName: contact ? contact.profile.name : 'Unknown',
            waId: contact ? contact.wa_id : message.from,
            conversationId: `conv_${message.from}_${value.metadata.display_phone_number}`,
            status: 'sent',
            isIncoming: message.from !== value.metadata.display_phone_number,
            createdAt: new Date(payload.createdAt || new Date()),
            phoneNumberId: value.metadata.phone_number_id
          }
        };
      } else if (value.statuses && value.statuses.length > 0) {
        // Process status update
        const status = value.statuses[0];
        return {
          type: 'status',
          data: {
            messageId: status.id,
            metaMsgId: status.meta_msg_id,
            status: status.status,
            timestamp: parseInt(status.timestamp),
            recipientId: status.recipient_id,
            conversationId: status.conversation ? status.conversation.id : null,
            pricing: status.pricing
          }
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error processing webhook payload:', error);
    return null;
  }
}

async function processSampleData() {
  const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp';
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    const client = await MongoClient.connect(mongoUrl);
    const db = client.db('whatsapp');
    
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    console.log('🗑️  Clearing existing messages...');
    await db.collection('processed_messages').deleteMany({});
    
    console.log('📤 Processing sample message payloads...');
    
    // Process message payloads
    let messageCount = 0;
    for (const payload of samplePayloads) {
      const processed = processWebhookPayload(payload);
      if (processed && processed.type === 'message') {
        await db.collection('processed_messages').insertOne(processed.data);
        console.log(`✅ Inserted message: ${processed.data.messageId} - "${processed.data.text.substring(0, 50)}..."`);
        messageCount++;
      }
    }
    
    console.log('📊 Processing status update payloads...');
    
    // Process status payloads
    let statusCount = 0;
    for (const payload of statusPayloads) {
      const processed = processWebhookPayload(payload);
      if (processed && processed.type === 'status') {
        const updateResult = await db.collection('processed_messages').updateOne(
          { 
            $or: [
              { messageId: processed.data.messageId },
              { messageId: processed.data.metaMsgId }
            ]
          },
          { 
            $set: { 
              status: processed.data.status,
              statusUpdatedAt: new Date()
            } 
          }
        );
        
        if (updateResult.modifiedCount > 0) {
          console.log(`✅ Updated message status: ${processed.data.messageId} -> ${processed.data.status}`);
          statusCount++;
        }
      }
    }
    
    // Display final statistics
    const totalMessages = await db.collection('processed_messages').countDocuments();
    const conversations = await db.collection('processed_messages').distinct('waId');
    
    console.log('\n📊 Processing Summary:');
    console.log(`   Messages inserted: ${messageCount}`);
    console.log(`   Status updates applied: ${statusCount}`);
    console.log(`   Total messages in database: ${totalMessages}`);
    console.log(`   Unique conversations: ${conversations.length}`);
    
    console.log('\n👥 Conversations:');
    for (const waId of conversations) {
      const lastMessage = await db.collection('processed_messages')
        .findOne({ waId }, { sort: { timestamp: -1 } });
      console.log(`   ${lastMessage.contactName} (${waId})`);
    }
    
    console.log('\n✅ Sample data processing completed successfully!');
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error processing sample data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  processSampleData();
}

module.exports = { processSampleData, processWebhookPayload };