/**
 * MongoDB Connection Test with URL-encoded Password
 * 
 * This script tests the connection to MongoDB Atlas with proper URL encoding
 * for special characters in the password.
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Get connection details from environment variables
const username = process.env.MONGODB_USER || 'danvoulez';
const password = process.env.MONGODB_PASSWORD;
const cluster = process.env.MONGODB_CLUSTER || 'cluster0.ftfwv.mongodb.net';
const options = process.env.MONGODB_OPTIONS || 'retryWrites=true&w=majority&appName=Cluster0';

// Function to test connection
async function testConnection() {
  try {
    // URL encode the password to handle special characters
    const encodedPassword = encodeURIComponent(password);
    
    // Construct the connection string with the encoded password
    const connectionString = `mongodb+srv://${username}:${encodedPassword}@${cluster}/?${options}`;
    
    console.log(`\nAttempting connection to MongoDB Atlas...`);
    console.log(`Username: ${username}`);
    console.log(`Cluster: ${cluster}`);
    console.log(`Password is included but not shown for security`);
    console.log(`Connection string (with password hidden): mongodb+srv://${username}:******@${cluster}/?${options}`);
    
    // Connect to MongoDB
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Add a shorter timeout for faster feedback
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    
    console.log('\n✅ Connection successful!');
    console.log(`\nConnected to MongoDB Atlas`);
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name || 'Default DB'}`);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nConnection closed.');
    
    return true;
  } catch (error) {
    console.error(`\n❌ Connection attempt failed: ${error.message}`);
    
    // Provide specific guidance based on the error message
    if (error.message.includes('bad auth')) {
      console.error('\nAuthentication Error: The username or password is incorrect.');
      console.error('Possible solutions:');
      console.error('1. Check if your password contains special characters that need URL encoding');
      console.error('2. Verify your username and password in MongoDB Atlas');
      console.error('3. Ensure your database user has the correct permissions');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\nConnection Error: Could not resolve the hostname.');
      console.error('Possible solutions:');
      console.error('1. Check your internet connection');
      console.error('2. Verify the cluster name is correct');
    } else if (error.message.includes('timed out')) {
      console.error('\nTimeout Error: The connection attempt timed out.');
      console.error('Possible solutions:');
      console.error('1. Check if your IP address is whitelisted in MongoDB Atlas');
      console.error('2. Verify that MongoDB Atlas is not experiencing an outage');
    }
    
    return false;
  }
}

// Start the test
testConnection();
