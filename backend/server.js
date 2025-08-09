const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (for production deployment)
app.use(express.static('public'));

// MongoDB connection
let db;
const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp';

async function connectToDatabase() {
  try {
    const client = await MongoClient.connect(mongoUrl);
    console.log('✅ Connected to MongoDB successfully');
    db = client.db('whatsapp');
    
    // Create indexes for better performance
    await db.collection('processed_messages').createIndex({ waId: 1, timestamp: 1 });
    await db.collection('processed_messages').createIndex({ messageId: 1 });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Initialize database connection
connectToDatabase();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);
  
  socket.on('join_conversation', (waId) => {
    socket.join(`conversation_${waId}`);
    console.log(`👤 User ${socket.id} joined conversation ${waId}`);
  });
  
  socket.on('leave_conversation', (waId) => {
    socket.leave(`conversation_${waId}`);
    console.log(`👤 User ${socket.id} left conversation ${waId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
  });
});

// Helper function to process webhook payload
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

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: db ? 'connected' : 'disconnected',
    version: '1.0.0'
  });
});

// Process webhook payload (Task 1)
app.post('/api/webhook', async (req, res) => {
  try {
    const payload = req.body;
    const processed = processWebhookPayload(payload);
    
    if (!processed) {
      return res.status(400).json({ 
        error: 'Invalid payload format',
        success: false 
      });
    }
    
    if (processed.type === 'message') {
      // Check if message already exists
      const existingMessage = await db.collection('processed_messages').findOne({
        messageId: processed.data.messageId
      });
      
      if (existingMessage) {
        return res.json({ 
          success: true, 
          message: 'Message already exists',
          type: 'duplicate'
        });
      }
      
      // Insert new message
      const result = await db.collection('processed_messages').insertOne(processed.data);
      
      // Emit to connected clients via Socket.IO
      io.emit('newMessage', processed.data);
      io.to(`conversation_${processed.data.waId}`).emit('newMessage', processed.data);
      
      res.json({ 
        success: true, 
        messageId: result.insertedId,
        type: 'message_inserted'
      });
      
    } else if (processed.type === 'status') {
      // Update message status
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
        // Emit status update to connected clients
        io.emit('statusUpdate', processed.data);
        
        // Get the updated message to emit to specific conversation
        const updatedMessage = await db.collection('processed_messages').findOne({
          $or: [
            { messageId: processed.data.messageId },
            { messageId: processed.data.metaMsgId }
          ]
        });
        
        if (updatedMessage) {
          io.to(`conversation_${updatedMessage.waId}`).emit('statusUpdate', {
            messageId: updatedMessage.messageId,
            status: processed.data.status
          });
        }
      }
      
      res.json({ 
        success: true, 
        updated: updateResult.modifiedCount > 0,
        type: 'status_updated'
      });
    }
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      success: false 
    });
  }
});

// Get all conversations grouped by user
app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await db.collection('processed_messages').aggregate([
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: "$waId",
          lastMessage: { $first: "$$ROOT" },
          messageCount: { $sum: 1 },
          unreadCount: { 
            $sum: { 
              $cond: [
                { 
                  $and: [
                    { $eq: ["$isIncoming", true] }, 
                    { $ne: ["$status", "read"] }
                  ] 
                }, 
                1, 
                0
              ] 
            }
          }
        }
      },
      {
        $sort: { "lastMessage.timestamp": -1 }
      }
    ]).toArray();
    
    res.json({
      success: true,
      conversations: conversations,
      count: conversations.length
    });
    
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch conversations',
      message: error.message,
      success: false 
    });
  }
});

// Get messages for a specific conversation
app.get('/api/conversations/:waId/messages', async (req, res) => {
  try {
    const { waId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const messages = await db.collection('processed_messages')
      .find({ waId })
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    
    // Mark incoming messages as read
    await db.collection('processed_messages').updateMany(
      { waId, isIncoming: true, status: { $ne: 'read' } },
      { $set: { status: 'read', statusUpdatedAt: new Date() } }
    );
    
    res.json({
      success: true,
      messages: messages,
      count: messages.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch messages',
      message: error.message,
      success: false 
    });
  }
});

// Send new message (Task 3 - Demo only)
app.post('/api/conversations/:waId/messages', async (req, res) => {
  try {
    const { waId } = req.params;
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({
        error: 'Message text is required',
        success: false
      });
    }
    
    // Get contact info from existing messages
    const existingMessage = await db.collection('processed_messages')
      .findOne({ waId });
    
    const newMessage = {
      messageId: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: "918329446654", // Business phone number
      to: waId,
      timestamp: Math.floor(Date.now() / 1000),
      text: text.trim(),
      messageType: "text",
      contactName: existingMessage ? existingMessage.contactName : "Unknown",
      waId: waId,
      conversationId: `conv_${waId}_918329446654`,
      status: "sent",
      isIncoming: false,
      createdAt: new Date(),
      phoneNumberId: "629305560276479"
    };
    
    const result = await db.collection('processed_messages').insertOne(newMessage);
    
    // Emit to connected clients immediately
    io.emit('newMessage', newMessage);
    io.to(`conversation_${waId}`).emit('newMessage', newMessage);
    
    // Simulate status updates with delays
    setTimeout(async () => {
      try {
        await db.collection('processed_messages').updateOne(
          { _id: result.insertedId },
          { $set: { status: "delivered", statusUpdatedAt: new Date() } }
        );
        
        const statusUpdate = { messageId: newMessage.messageId, status: 'delivered' };
        io.emit('statusUpdate', statusUpdate);
        io.to(`conversation_${waId}`).emit('statusUpdate', statusUpdate);
      } catch (err) {
        console.error('Error updating message status to delivered:', err);
      }
    }, 1000);
    
    setTimeout(async () => {
      try {
        await db.collection('processed_messages').updateOne(
          { _id: result.insertedId },
          { $set: { status: "read", statusUpdatedAt: new Date() } }
        );
        
        const statusUpdate = { messageId: newMessage.messageId, status: 'read' };
        io.emit('statusUpdate', statusUpdate);
        io.to(`conversation_${waId}`).emit('statusUpdate', statusUpdate);
      } catch (err) {
        console.error('Error updating message status to read:', err);
      }
    }, 3000);
    
    res.json({ 
      success: true, 
      message: newMessage,
      messageId: result.insertedId 
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      message: error.message,
      success: false 
    });
  }
});

// Delete conversation (bonus feature)
app.delete('/api/conversations/:waId', async (req, res) => {
  try {
    const { waId } = req.params;
    
    const result = await db.collection('processed_messages').deleteMany({ waId });
    
    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: 'Conversation deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ 
      error: 'Failed to delete conversation',
      message: error.message,
      success: false 
    });
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    success: false
  });
});

// Catch all handler for frontend routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 WhatsApp Clone Backend API ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});