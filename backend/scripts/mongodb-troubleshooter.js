/**
 * MongoDB Connection Troubleshooter
 * 
 * This script provides comprehensive troubleshooting for MongoDB Atlas connection issues.
 */

const mongoose = require('mongoose');
const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to get the current public IP address
function getPublicIP() {
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org', (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data.trim());
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Function to attempt connection with different options
async function testConnection(username, password, cluster, options = {}) {
  try {
    // Encode the password to handle special characters
    const encodedPassword = encodeURIComponent(password);
    
    // Construct the connection string
    const connectionString = `mongodb+srv://${username}:${encodedPassword}@${cluster}/?retryWrites=true&w=majority&appName=Cluster0`;
    
    console.log(`\nAttempting connection with username: ${username}`);
    console.log(`Using cluster: ${cluster}`);
    console.log('Password is included but not shown for security');
    
    if (Object.keys(options).length > 0) {
      console.log('Using additional options:', JSON.stringify(options));
    }
    
    // Connect to MongoDB
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ...options,
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
    return false;
  }
}

// Main troubleshooting function
async function troubleshoot() {
  console.log('=== MongoDB Atlas Connection Troubleshooter ===');
  console.log('This tool will help diagnose connection issues with MongoDB Atlas');
  
  try {
    // Get the current public IP address
    const publicIP = await getPublicIP();
    console.log(`\nYour current public IP address is: ${publicIP}`);
    console.log('Make sure this IP address is whitelisted in your MongoDB Atlas Network Access settings');
    console.log('You can whitelist your IP in MongoDB Atlas by going to:');
    console.log('Network Access > ADD IP ADDRESS > ADD CURRENT IP ADDRESS');
    
    // Ask for connection details
    rl.question('\nEnter your MongoDB Atlas username (default: danvoulez): ', (username) => {
      username = username || 'danvoulez';
      
      rl.question('Enter your MongoDB Atlas password: ', async (password) => {
        if (!password) {
          console.error('Password cannot be empty');
          rl.close();
          return;
        }
        
        rl.question('Enter your cluster address (default: cluster0.ftfwv.mongodb.net): ', async (cluster) => {
          cluster = cluster || 'cluster0.ftfwv.mongodb.net';
          
          console.log('\n=== Testing connection with different configurations ===');
          
          // Test 1: Basic connection
          console.log('\n[Test 1] Basic connection test');
          const basicSuccess = await testConnection(username, password, cluster);
          
          // Test 2: With authSource admin
          console.log('\n[Test 2] Testing with authSource=admin');
          const authSourceSuccess = await testConnection(username, password, cluster, {
            authSource: 'admin'
          });
          
          // Test 3: With direct connection
          console.log('\n[Test 3] Testing with directConnection=true');
          const directSuccess = await testConnection(username, password, cluster, {
            directConnection: true
          });
          
          // Test 4: With different auth mechanism
          console.log('\n[Test 4] Testing with SCRAM-SHA-1 auth mechanism');
          const scramSuccess = await testConnection(username, password, cluster, {
            authMechanism: 'SCRAM-SHA-1'
          });
          
          // Summary
          console.log('\n=== Troubleshooting Summary ===');
          if (basicSuccess || authSourceSuccess || directSuccess || scramSuccess) {
            console.log('✅ Connection successful with at least one configuration!');
            if (authSourceSuccess && !basicSuccess) {
              console.log('Recommendation: Add authSource=admin to your connection string');
            } else if (directSuccess && !basicSuccess) {
              console.log('Recommendation: Add directConnection=true to your connection options');
            } else if (scramSuccess && !basicSuccess) {
              console.log('Recommendation: Use SCRAM-SHA-1 auth mechanism');
            }
          } else {
            console.log('❌ All connection attempts failed');
            console.log('\nPossible issues:');
            console.log('1. Your IP address is not whitelisted in MongoDB Atlas');
            console.log('2. The username or password is incorrect');
            console.log('3. The database user does not have the necessary permissions');
            console.log('4. The cluster name is incorrect or the cluster is not running');
            console.log('\nRecommended actions:');
            console.log('1. Double-check your username and password in MongoDB Atlas');
            console.log('2. Ensure your IP address is whitelisted in Network Access settings');
            console.log('3. Verify the cluster is running and accessible');
            console.log('4. Try creating a new database user with password authentication');
          }
          
          rl.close();
        });
      });
    });
  } catch (error) {
    console.error(`Error during troubleshooting: ${error.message}`);
    rl.close();
  }
}

// Start the troubleshooting process
troubleshoot();
