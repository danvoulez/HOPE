/**
 * Direct MongoDB Authentication Test
 * 
 * This script tests MongoDB Atlas connection with direct authentication options
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Get connection details from environment variables or use the provided values
const username = process.env.MONGODB_USER || 'danvoulez';
const password = process.env.MONGODB_PASSWORD || 'wGVHyAgaYzDjOSmK'; // Using the password you provided
const cluster = process.env.MONGODB_CLUSTER || 'cluster0.ftfwv.mongodb.net';

// Function to test connection with different auth options
async function testConnectionWithOptions() {
  // URL encode the password to handle special characters
  const encodedPassword = encodeURIComponent(password);
  
  // Base connection string
  const baseConnectionString = `mongodb+srv://${username}:${encodedPassword}@${cluster}`;
  
  // Different connection options to try
  const connectionOptions = [
    { 
      name: "Standard connection", 
      uri: `${baseConnectionString}/?retryWrites=true&w=majority&appName=Cluster0`,
      options: { useNewUrlParser: true, useUnifiedTopology: true }
    },
    { 
      name: "With authSource admin", 
      uri: `${baseConnectionString}/?retryWrites=true&w=majority&authSource=admin&appName=Cluster0`,
      options: { useNewUrlParser: true, useUnifiedTopology: true }
    },
    { 
      name: "With SCRAM-SHA-1 auth mechanism", 
      uri: `${baseConnectionString}/?retryWrites=true&w=majority&appName=Cluster0`,
      options: { 
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        authMechanism: 'SCRAM-SHA-1'
      }
    },
    { 
      name: "Connection with minimal options", 
      uri: `${baseConnectionString}/?appName=Cluster0`,
      options: { useNewUrlParser: true, useUnifiedTopology: true }
    }
  ];

  // Try each connection option
  for (const connOption of connectionOptions) {
    console.log(`\n\n=== Testing ${connOption.name} ===`);
    console.log(`Connection string (with password hidden): ${connOption.uri.replace(encodedPassword, '******')}`);
    
    try {
      // Set shorter timeouts for faster feedback
      const options = {
        ...connOption.options,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      };
      
      // Connect to MongoDB
      const conn = await mongoose.connect(connOption.uri, options);
      
      console.log('\n✅ Connection successful!');
      console.log(`Connected to MongoDB Atlas`);
      console.log(`Host: ${conn.connection.host}`);
      console.log(`Database Name: ${conn.connection.name || 'Default DB'}`);
      
      // Close the connection
      await mongoose.connection.close();
      console.log('Connection closed.');
      
      // If successful, no need to try other options
      return true;
    } catch (error) {
      console.error(`\n❌ Connection attempt failed: ${error.message}`);
      
      // Continue to the next option
      await mongoose.connection.close().catch(() => {});
    }
  }
  
  console.log('\n\n=== All connection attempts failed ===');
  console.log('Possible issues:');
  console.log('1. The username or password is incorrect');
  console.log('2. Your IP address is not whitelisted in MongoDB Atlas');
  console.log('3. The database user does not have the necessary permissions');
  console.log('4. The cluster name is incorrect');
  
  return false;
}

// Start the test
testConnectionWithOptions();
