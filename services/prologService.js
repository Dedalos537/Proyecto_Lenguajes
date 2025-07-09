// prologService.js
const path = require('path');
const { spawn } = require('child_process');
const { User } = require('../config/database'); // Import the User model

// Esta es una implementación simplificada. En un entorno de producción,
// se consideraría una librería como 'swipl-prolog-bridge' o una gestión
// más robusta del proceso de Prolog. [cite: 10]
class PrologService {
    constructor() {
        this.prologPath = path.join(__dirname, '..', 'prolog', 'policies.pl'); // [cite: 11]
        this.isReady = false; // [cite: 11]
        this.queue = []; // Para manejar peticiones mientras Prolog inicia [cite: 12]
        this.prologProcess = null; // [cite: 12]
        this.initProlog(); // [cite: 13]
    }

    initProlog() {
        this.prologProcess = spawn('swipl', ['-s', this.prologPath, '-g', 'halt', '-q']); // [cite: 13]
        this.prologProcess.stdout.on('data', (data) => { // [cite: 14]
            console.log(`Prolog stdout: ${data}`); // [cite: 14]
            // Aquí se puede procesar la salida de Prolog si es necesario
        });
        this.prologProcess.stderr.on('data', (data) => { // [cite: 15]
            console.error(`Prolog stderr: ${data}`); // [cite: 15]
        });
        this.prologProcess.on('error', (err) => { // [cite: 16]
            console.error('Error al iniciar el proceso de prolog:', err); // [cite: 16]
            this.isReady = false; // [cite: 16]
        });
        this.prologProcess.on('close', (code) => { // [cite: 17]
            console.log(`Salio el proceso de prolog con codigo ${code}`); // [cite: 17]
            this.isReady = false; // [cite: 17]
            // se puede intentar reiniciar o manejar el error
        });
        // Simula que Prolog está listo después de un breve retraso
        setTimeout(() => { // [cite: 18]
            this.isReady = true; // [cite: 18]
            console.log('Servicio Prolog Listo'); // [cite: 18]
            this.processQueue(); // [cite: 18]
        }, 1000); // [cite: 19]
    }

    processQueue() { // [cite: 19]
        while (this.queue.length > 0) { // [cite: 19]
            const { query, resolve, reject } = this.queue.shift(); // [cite: 20]
            this.executeQuery(query).then(resolve).catch(reject); // [cite: 20]
        }
    }

    async executeQuery(query) { // [cite: 21]
        return new Promise((resolve, reject) => { // [cite: 22]
            if (!this.isReady) { // [cite: 22]
                this.queue.push({ query, resolve, reject }); // [cite: 22]
                return; // [cite: 22]
            }

            console.log(`Ejecutando query en Prolog: ${query}`); // [cite: 22]

            // --- MODIFICACIÓN CLAVE: La simulación de Prolog ahora usa los tipos de cookie para el consentimiento ---
            if (query.startsWith('can_set_cookie')) {
                // Parse the query to extract cookieType and ConsentGivenForType
                // Example: can_set_cookie(analytics, true).
                const match = query.match(/can_set_cookie\((\w+),\s*(true|false)\)/);
                if (match) {
                    const cookieType = match[1];
                    const consentGivenForType = match[2] === 'true';

                    // Essential cookies never require consent [cite: 1]
                    if (cookieType === 'essential') {
                        resolve(true);
                    } else if (consentGivenForType) { // If consent is true for other types [cite: 3]
                        resolve(true);
                    } else { // No consent, cannot set [cite: 4]
                        resolve(false);
                    }
                } else {
                    reject(new Error('Formato de query can_set_cookie no válido.'));
                }
            } else if (query.startsWith('requires_consent')) { // [cite: 24]
                if (query.includes('essential')) { // [cite: 24]
                    resolve(false); // [cite: 24]
                } else { // [cite: 25]
                    resolve(true); // [cite: 25]
                }
            } else if (query.startsWith('classify_cookie')) { // [cite: 26]
                if (query.includes('session_id') || query.includes('csrf_token')) { // [cite: 26]
                    resolve('essential'); // [cite: 27]
                } else if (query.includes('_ga') || query.includes('_utm')) { // [cite: 27]
                    resolve('analytics'); // [cite: 28]
                } else if (query.includes('ad_id') || query.includes('fb_pixel')) { // [cite: 28]
                    resolve('marketing'); // [cite: 29]
                } else { // [cite: 29]
                    resolve('unknown'); // [cite: 30]
                }
            } else { // [cite: 30]
                reject(new Error('Query no soportada por el ejemplo')); // [cite: 31]
            }
        });
    }

    // --- NUEVO MÉTODO PARA OBTENER CONSENTIMIENTO DEL USUARIO DESDE LA DB ---
    async getUserConsent(userId, cookieType) {
        try {
            const user = await User.findByPk(userId); // Use the Sequelize User model
            if (!user) {
                console.warn(`Usuario con ID ${userId} no encontrado.`);
                return false; // Default to no consent if user doesn't exist
            }

            // Map cookieType to the corresponding consent field in the User model
            switch (cookieType) {
                case 'analytics':
                    return user.consent_analytics_cookies;
                case 'marketing':
                    return user.consent_marketing_cookies;
                case 'essential':
                    return true; // Essential cookies don't require explicit user consent [cite: 1]
                case 'performance':
                    // Assuming you add 'consent_performance_cookies' to your User model
                    return user.consent_performance_cookies || false;
                default:
                    return false; // Unknown cookie types default to no consent
            }
        } catch (error) {
            console.error(`Error al obtener el consentimiento para el usuario ${userId} y tipo ${cookieType}:`, error);
            throw new Error(`Error al obtener consentimiento del usuario: ${error.message}`);
        }
    }

    // --- MODIFICACIÓN DEL MÉTODO canSetCookie: Ahora requiere userId ---
    async canSetCookie(userId, cookieType) {
        let consentGivenForType = false;
        if (cookieType !== 'essential') { // Only check for consent if not essential [cite: 1, 2]
            consentGivenForType = await this.getUserConsent(userId, cookieType);
        } else {
            consentGivenForType = true; // Essential cookies always have implied consent [cite: 1, 2]
        }

        const query = `can_set_cookie(${cookieType}, ${consentGivenForType}).`; // 
        return this.executeQuery(query); // 
    }

    async requiresConsent(cookieType) { // 
        const query = `requires_consent(${cookieType}, Requires).`; // [cite: 33]
        const result = await this.executeQuery(query); // [cite: 33]
        return result; // Asume que la simulación retorna directamente el booleano [cite: 33]
    }

    async classifyCookie(cookieName) { // [cite: 34]
        const query = `classify_cookie(${cookieName}, Type).`; // [cite: 34]
        const result = await this.executeQuery(query); // [cite: 34]
        return result; // Asume que la simulación retorna el tipo [cite: 34]
    }
}

module.exports = new PrologService(); // [cite: 35]