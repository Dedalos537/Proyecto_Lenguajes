const express = require('express');
const cookieParser = require('cookie-parser');
const prologService = require('./services/prologService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(cookieParser()); 

// --- Multiparadigma en acción ---

// Ruta para establecer una cookie (Ejemplo con programación procedural y lógica)
app.post('/set-cookie', async (req, res) => {
    const { name, value, type, consentGiven } = req.body;

    if (!name || !value || !type) {
        return res.status(400).json({ message: 'Nombre, valor y tipo de cookie son requeridos.' });
    }

    try {
        // Consulta la lógica Prolog para determinar si se puede establecer la cookie
        const canSet = await prologService.canSetCookie(type, consentGiven);

        if (canSet) {
            // Ejemplo de opciones de cookie (programación procedural)
            let cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Solo en HTTPS en producción
                maxAge: 3600000, // 1 hora
            };

            // Lógica adicional basada en el tipo (ej. cookies esenciales expiran con la sesión)
            const requiresConsent = await prologService.requiresConsent(type);
            if (!requiresConsent) { // Si no requiere consentimiento (ej. esencial)
                cookieOptions.maxAge = undefined; // Cookie de sesión
            }

            res.cookie(name, value, cookieOptions);
            res.status(200).json({ message: `Cookie '${name}' establecida correctamente.` });
        } else {
            res.status(403).json({ message: `No se permite establecer la cookie '${name}' de tipo '${type}' sin el consentimiento adecuado.` });
        }
    } catch (error) {
        console.error('Error al establecer la cookie:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar la solicitud de cookie.' });
    }
});

// Ruta para verificar el consentimiento requerido (Ejemplo con programación lógica)
app.get('/check-consent/:cookieType', async (req, res) => {
    const { cookieType } = req.params;

    try {
        const requires = await prologService.requiresConsent(cookieType);
        res.status(200).json({ cookieType, requiresConsent: requires });
    } catch (error) {
        console.error('Error al verificar el consentimiento:', error);
        res.status(500).json({ message: 'Error interno del servidor al verificar el consentimiento.' });
    }
});

// Ruta para clasificar una cookie (Ejemplo con programación lógica)
app.get('/classify-cookie/:cookieName', async (req, res) => {
    const { cookieName } = req.params;

    try {
        const type = await prologService.classifyCookie(cookieName);
        res.status(200).json({ cookieName, classifiedType: type });
    } catch (error) {
        console.error('Error al clasificar la cookie:', error);
        res.status(500).json({ message: 'Error interno del servidor al clasificar la cookie.' });
    }
});


// Ruta para obtener todas las cookies del cliente (ejemplo básico, solo muestra las que recibe el servidor)
app.get('/get-cookies', (req, res) => {
    // req.cookies contiene las cookies parseadas por 'cookie-parser'
    res.status(200).json({ cookies: req.cookies });
});


// Inicio del servidor
app.listen(PORT, () => {
    console.log(`Microservicio de gestión de cookies escuchando en el puerto ${PORT}`);
    console.log(`Accede a http://localhost:${PORT}`);
});