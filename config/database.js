// config/database.js
const { Sequelize, DataTypes } = require('sequelize'); // Example using Sequelize

// Replace with your actual database connection details
const sequelize = new Sequelize('LENGUAJES', 'root', 'Rucula_530', {
    host: 'localhost',
    dialect: 'mysql', // or 'postgres', 'sqlite', 'mssql'
    logging: false, // Set to true to see SQL queries in console
});

// Define the User model (assuming your 'Usuario' table)
const User = sequelize.define('Usuario', {
    Id_Usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    correo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    contraseña: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // Add fields for cookie consent preferences
    consent_analytics_cookies: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    consent_marketing_cookies: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    // Add other consent fields as needed based on your cookie types
}, {
    tableName: 'Usuario', // Ensure this matches your actual table name
    timestamps: false, // Set to true if you have createdAt and updatedAt fields
});

async function connectDB() {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos establecida exitosamente.');
        await sequelize.sync({ alter: true }); // Use this cautiously in production to sync models
    } catch (error) {
        console.error('No se pudo conectar a la base de datos:', error);
        process.exit(1); // Exit process if DB connection fails
    }
}

module.exports = {
    sequelize,
    User,
    connectDB,
};