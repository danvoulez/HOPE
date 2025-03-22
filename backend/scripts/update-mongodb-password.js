/**
 * MongoDB Password Update Script
 * 
 * This script updates the MongoDB password in your .env file
 * and tests the connection to ensure it works.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.resolve(__dirname, '../.env');

// Function to read the .env file
function readEnvFile() {
  try {
    return fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.error(`Error reading .env file: ${error.message}`);
    process.exit(1);
  }
}

// Function to update the .env file with the new password
function updateEnvFile(content, password) {
  try {
    // Check if MONGODB_PASSWORD exists in the file
    if (content.includes('MONGODB_PASSWORD=')) {
      // Replace the existing password
      const updatedContent = content.replace(
        /MONGODB_PASSWORD=.*/,
        `MONGODB_PASSWORD=${password}`
      );
      fs.writeFileSync(envPath, updatedContent);
    } else {
      // Add MONGODB_PASSWORD if it doesn't exist
      const updatedContent = content + `\nMONGODB_PASSWORD=${password}\n`;
      fs.writeFileSync(envPath, updatedContent);
    }
    
    console.log('✅ .env file updated successfully with the new password.');
  } catch (error) {
    console.error(`Error updating .env file: ${error.message}`);
    process.exit(1);
  }
}

// Function to fix the MONGODB_URI if it has a duplicate prefix
function fixMongoURI(content) {
  if (content.includes('MONGODB_URI=MONGODB_URI=')) {
    console.log('⚠️ Found duplicate MONGODB_URI= prefix in your connection string. Fixing it...');
    const updatedContent = content.replace(
      /MONGODB_URI=MONGODB_URI=/,
      'MONGODB_URI='
    );
    fs.writeFileSync(envPath, updatedContent);
    console.log('✅ Fixed the connection string in .env file.');
    return updatedContent;
  }
  return content;
}

// Function to test the MongoDB connection
async function testConnection(password) {
  try {
    console.log('\nTesting connection to MongoDB Atlas...');
    
    // Read the updated .env file
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Extract the MONGODB_URI
    const uriMatch = envContent.match(/MONGODB_URI=([^\n]+)/);
    if (!uriMatch) {
      throw new Error('MONGODB_URI not found in .env file');
    }
    
    let connectionString = uriMatch[1];
    
    // Replace the password placeholder
    if (connectionString.includes('<db_password>')) {
      connectionString = connectionString.replace('<db_password>', password);
    }
    
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
    
    return true;
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error(`Error: ${error.message}`);
    
    if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.error('\nThe password you provided is not valid for this MongoDB Atlas account.');
    }
    
    return false;
  }
}

// Main function
async function main() {
  console.log('MongoDB Password Update Utility');
  console.log('===============================');
  
  // Read the current .env file
  let envContent = readEnvFile();
  
  // Fix the MONGODB_URI if needed
  envContent = fixMongoURI(envContent);
  
  rl.question('\nPlease enter your MongoDB Atlas password: ', async (password) => {
    // Update the .env file with the new password
    updateEnvFile(envContent, password);
    
    // Test the connection with the new password
    const success = await testConnection(password);
    
    if (success) {
      console.log('\n🎉 Your MongoDB Atlas connection is now working correctly!');
    } else {
      console.log('\n❌ Connection still failed. Please check your MongoDB Atlas credentials and try again.');
    }
    
    rl.close();
  });
}

// Run the main function
main();
