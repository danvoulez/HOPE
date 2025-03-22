const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Replace <db_password> placeholder with actual password from environment variables
    let connectionString = process.env.MONGODB_URI;
    
    if (connectionString.includes('<db_password>') && process.env.MONGODB_PASSWORD) {
      connectionString = connectionString.replace('<db_password>', process.env.MONGODB_PASSWORD);
    }
    
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Conectado: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Erro ao conectar ao MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
