/**
 * MongoDB Connection Test Script
 * 
 * This script tests the connection to MongoDB Atlas using the credentials
 * from the .env file and displays basic database information.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    console.log('Environment variables loaded:');
    console.log(`- MONGODB_URI: ${process.env.MONGODB_URI ? '✓ Set' : '✗ Not set'}`);
    console.log(`- MONGODB_PASSWORD: ${process.env.MONGODB_PASSWORD ? '✓ Set' : '✗ Not set'}`);
    
    // Replace <db_password> placeholder with actual password from environment variables
    let connectionString = process.env.MONGODB_URI;
    
    // Check if connection string is valid
    if (!connectionString) {
      throw new Error('MONGODB_URI is not defined in your .env file');
    }
    
    // Check for duplicate MONGODB_URI= in the connection string (common mistake)
    if (connectionString.startsWith('MONGODB_URI=')) {
      console.log('\n⚠️ Warning: Your connection string starts with "MONGODB_URI=", which is likely a mistake.');
      console.log('Attempting to fix by removing the prefix...');
      connectionString = connectionString.replace('MONGODB_URI=', '');
    }
    
    // Replace password placeholder
    if (connectionString.includes('<db_password>')) {
      if (!process.env.MONGODB_PASSWORD) {
        throw new Error('MONGODB_PASSWORD is not defined in your .env file');
      }
      connectionString = connectionString.replace('<db_password>', process.env.MONGODB_PASSWORD);
    }
    
    console.log('\nUsing connection string (with password hidden):', 
      connectionString.replace(/:[^:]*@/, ':****@'));
    
    // Connect to MongoDB
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('\n✅ Connection successful!');
    console.log(`\nConnected to MongoDB Atlas`);
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name || 'Default DB'}`);
    
    // Get list of collections
    const collections = await conn.connection.db.listCollections().toArray();
    
    if (collections.length > 0) {
      console.log('\nAvailable collections:');
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    } else {
      console.log('\nNo collections found in this database.');
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nConnection closed.');
    
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error(`Error: ${error.message}`);
    
    // Provide troubleshooting tips based on common errors
    if (error.message.includes('ENOTFOUND')) {
      console.error('\nTroubleshooting tip: Host not found. Check your MongoDB URI for typos.');
    } else if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.error('\nTroubleshooting tip: Authentication failed. Check your username and password.');
      console.error('Make sure your MONGODB_PASSWORD in .env is correct and does not contain special characters that need URL encoding.');
    } else if (error.message.includes('timed out')) {
      console.error('\nTroubleshooting tip: Connection timed out. Check your network or firewall settings.');
    }
    
    process.exit(1);
  }
}

// Run the test
testConnection();
