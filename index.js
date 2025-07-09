const express = require('express'); // [cite: 35]
const cookieParser = require('cookie-parser'); // [cite: 35]
const prologService = require('./services/prologService'); // [cite: 35]
const { connectDB, User } = require('./config/database'); // Import database connection and models

const app = express(); // 
const PORT = process.env.PORT || 3000; // 

// Middlewares
app.use(express.json()); // 
app.use(cookieParser()); // 

// Connect to the database when the application starts
connectDB();

// --- Multiparadigma en acción ---

// Ruta para establecer una cookie (Ejemplo con programación procedural y lógica)
app.post('/set-cookie', async (req, res) => { // 
    const { name, value, type } = req.body;
    // IMPORTANT: In a real application, userId would come from an authenticated session/token.
    // For this example, we'll assume a userId is passed or retrieved.
    // Let's assume a dummy user ID for now, or you can add it to req.body for testing:
    const userId = req.body.userId || 1; // Example: assuming user ID 1 exists and is authenticated

    if (!name || !value || !type || !userId) {
        return res.status(400).json({ message: 'Nombre, valor, tipo de cookie y ID de usuario son requeridos.' });
    }

    try {
        // Consulta la lógica Prolog para determinar si se puede establecer la cookie,
        // ahora considerando el consentimiento del usuario desde la DB. 
        const canSet = await prologService.canSetCookie(userId, type); // Modified call: pass userId 

        if (canSet) { // 
            // Ejemplo de opciones de cookie (programación procedural) [cite: 38]
            let cookieOptions = { // [cite: 38]
                httpOnly: true, // [cite: 38]
                secure: process.env.NODE_ENV === 'production', // Solo en HTTPS en producción [cite: 38]
                maxAge: 3600000, // 1 hora [cite: 38]
            };

            // Lógica adicional basada en el tipo (ej. cookies esenciales expiran con la sesión) [cite: 39]
            const requiresConsent = await prologService.requiresConsent(type); // [cite: 39]
            if (!requiresConsent) { // Si no requiere consentimiento (ej. esencial) [cite: 39]
                cookieOptions.maxAge = undefined; // [cite: 40]
                // Cookie de sesión [cite: 40]
            }

            res.cookie(name, value, cookieOptions); // [cite: 41]
            res.status(200).json({ message: `Cookie '${name}' establecida correctamente.` }); // [cite: 41]
        } else {
            res.status(403).json({ message: `No se permite establecer la cookie '${name}' de tipo '${type}' para el usuario con ID ${userId} sin el consentimiento adecuado.` }); // [cite: 42]
        }
    } catch (error) {
        console.error('Error al establecer la cookie:', error); // [cite: 43]
        res.status(500).json({ message: 'Error interno del servidor al procesar la solicitud de cookie.' }); // [cite: 43]
    }
});

// --- NUEVA RUTA PARA ACTUALIZAR EL CONSENTIMIENTO DEL USUARIO ---
app.post('/update-consent', async (req, res) => {
    const { userId, analytics, marketing } = req.body; // Add more cookie types as needed

    if (!userId || typeof analytics !== 'boolean' || typeof marketing !== 'boolean') {
        return res.status(400).json({ message: 'ID de usuario y estados de consentimiento son requeridos y deben ser booleanos.' });
    }

    try {
        const [updatedRows] = await User.update(
            {
                consent_analytics_cookies: analytics,
                consent_marketing_cookies: marketing,
                // Add updates for other cookie types
            },
            {
                where: { Id_Usuario: userId }
            }
        );

        if (updatedRows > 0) {
            res.status(200).json({ message: `Consentimiento del usuario ${userId} actualizado correctamente.`, analyticsConsent: analytics, marketingConsent: marketing });
        } else {
            res.status(404).json({ message: `Usuario con ID ${userId} no encontrado.` });
        }
    } catch (error) {
        console.error('Error al actualizar el consentimiento del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el consentimiento.' });
    }
});


// Ruta para verificar el consentimiento requerido (Ejemplo con programación lógica)
app.get('/check-consent/:cookieType', async (req, res) => { // [cite: 44]
    const { cookieType } = req.params; // [cite: 44]

    try {
        const requires = await prologService.requiresConsent(cookieType); // [cite: 44]
        res.status(200).json({ cookieType, requiresConsent: requires }); // [cite: 44]
    } catch (error) {
        console.error('Error al verificar el consentimiento:', error); // [cite: 44]
        res.status(500).json({ message: 'Error interno del servidor al verificar el consentimiento.' }); // [cite: 44]
    }
}); // [cite: 45]

// Ruta para clasificar una cookie (Ejemplo con programación lógica)
app.get('/classify-cookie/:cookieName', async (req, res) => { // [cite: 45]
    const { cookieName } = req.params; // [cite: 45]

    try {
        const type = await prologService.classifyCookie(cookieName); // [cite: 45]
        res.status(200).json({ cookieName, classifiedType: type }); // [cite: 45]
    } catch (error) {
        console.error('Error al clasificar la cookie:', error); // [cite: 45]
        res.status(500).json({ message: 'Error interno del servidor al clasificar la cookie.' }); // [cite: 45]
    }
}); // [cite: 46]

// Ruta para obtener todas las cookies del cliente (ejemplo básico, solo muestra las que recibe el servidor)
app.get('/get-cookies', (req, res) => { // [cite: 46]
    // req.cookies contiene las cookies parseadas por 'cookie-parser' [cite: 46]
    res.status(200).json({ cookies: req.cookies }); // [cite: 46]
}); // [cite: 47]

// Inicio del servidor
app.listen(PORT, () => { // [cite: 47]
    console.log(`Microservicio de gestión de cookies escuchando en el puerto ${PORT}`); // [cite: 47]
    console.log(`Accede a http://localhost:${PORT}`); // [cite: 48]
});