/**
 * Direct MongoDB Connection Test
 * 
 * This script tests connecting to MongoDB Atlas with hardcoded credentials
 * to isolate any issues with environment variable loading.
 */

const mongoose = require('mongoose');

// IMPORTANT: Replace these with your actual MongoDB credentials
const username = 'danvoulez';
const password = 'yb6mhx9m17GxYietR'; 
const cluster = 'cluster0.ftfwv.mongodb.net';
const options = 'retryWrites=true&w=majority&appName=Cluster0';

// Construct the connection string directly
const connectionString = `mongodb+srv://${username}:${encodeURIComponent(password)}@${cluster}/?${options}`;

async function testDirectConnection() {
  try {
    console.log('Attempting direct connection to MongoDB Atlas...');
    console.log(`Using username: ${username}`);
    console.log(`Using cluster: ${cluster}`);
    console.log('Password is included but not shown for security');
    
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
    
    // Provide detailed troubleshooting information
    if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.error('\nAuthentication failed. Possible reasons:');
      console.error('1. The password may be incorrect');
      console.error('2. The username may be incorrect');
      console.error('3. Special characters in the password might need proper URL encoding');
      console.error('4. The user might not have access to this database');
      console.error('\nTry checking your MongoDB Atlas dashboard to verify credentials.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\nHost not found. Check your cluster name for typos.');
    } else if (error.message.includes('timed out')) {
      console.error('\nConnection timed out. Check your network or firewall settings.');
      console.error('Make sure your IP address is whitelisted in MongoDB Atlas.');
    }
    
    process.exit(1);
  }
}

// Run the test
testDirectConnection();
