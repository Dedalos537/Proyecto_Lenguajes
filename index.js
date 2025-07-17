const express = require('express');
const cookieParser = require('cookie-parser');
const prologService = require('./services/prologService');
const { connectDB, User } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

connectDB();

app.post('/set-cookie', async (req, res) => {
    const { name, value, type } = req.body;
    const userId = req.body.userId || 1;

    if (!name || !value || !type || !userId) {
        return res.status(400).json({ message: 'Nombre, valor, tipo de cookie y ID de usuario son requeridos.' });
    }

    try {
        const canSet = await prologService.canSetCookie(userId, type);

        if (canSet) {
            let cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 3600000,
            };

            const requiresConsent = await prologService.requiresConsent(type);
            if (!requiresConsent) {
                cookieOptions.maxAge = undefined;
            }

            res.cookie(name, value, cookieOptions);
            res.status(200).json({ message: `Cookie '${name}' establecida correctamente.` });
        } else {
            res.status(403).json({ message: `No se permite establecer la cookie '${name}' de tipo '${type}' para el usuario con ID ${userId} sin el consentimiento adecuado.` });
        }
    } catch (error) {
        console.error('Error al establecer la cookie:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar la solicitud de cookie.' });
    }
});

app.post('/update-consent', async (req, res) => {
    const { userId, analytics, marketing } = req.body;

    if (!userId || typeof analytics !== 'boolean' || typeof marketing !== 'boolean') {
        return res.status(400).json({ message: 'ID de usuario y estados de consentimiento son requeridos y deben ser booleanos.' });
    }

    try {
        const [updatedRows] = await User.update(
            {
                consent_analytics_cookies: analytics,
                consent_marketing_cookies: marketing,
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

app.get('/get-cookies', (req, res) => {
    res.status(200).json({ cookies: req.cookies });
});

app.listen(PORT, () => {
    console.log(`Microservicio de gestión de cookies escuchando en el puerto ${PORT}`);
    console.log(`Accede a http://localhost:${PORT}`);
});