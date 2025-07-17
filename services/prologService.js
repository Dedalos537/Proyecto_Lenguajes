const path = require('path');
const { spawn } = require('child_process');
const { User } = require('../config/database');

class PrologService {
    constructor() {
        this.prologPath = path.join(__dirname, '..', 'prolog', 'policies.pl');
        this.isReady = false;
        this.queue = [];
        this.prologProcess = null;
        this.initProlog();
    }

    initProlog() {
        this.prologProcess = spawn('swipl', ['-s', this.prologPath, '-g', 'halt', '-q']);
        this.prologProcess.stdout.on('data', (data) => {});
        this.prologProcess.stderr.on('data', (data) => {});
        this.prologProcess.on('error', (err) => { this.isReady = false; });
        this.prologProcess.on('close', (code) => { this.isReady = false; });
        setTimeout(() => {
            this.isReady = true;
            this.processQueue();
        }, 1000);
    }

    processQueue() {
        while (this.queue.length > 0) {
            const { query, resolve, reject } = this.queue.shift();
            this.executeQuery(query).then(resolve).catch(reject);
        }
    }

    async executeQuery(query) {
        return new Promise((resolve, reject) => {
            if (!this.isReady) {
                this.queue.push({ query, resolve, reject });
                return;
            }
            if (query.startsWith('can_set_cookie')) {
                const match = query.match(/can_set_cookie\((\w+),\s*(true|false)\)/);
                if (match) {
                    const cookieType = match[1];
                    const consentGivenForType = match[2] === 'true';
                    if (cookieType === 'essential') {
                        resolve(true);
                    } else if (consentGivenForType) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                } else {
                    reject(new Error('Formato de query can_set_cookie no válido.'));
                }
            } else if (query.startsWith('requires_consent')) {
                if (query.includes('essential')) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            } else if (query.startsWith('classify_cookie')) {
                if (query.includes('session_id') || query.includes('csrf_token')) {
                    resolve('essential');
                } else if (query.includes('_ga') || query.includes('_utm')) {
                    resolve('analytics');
                } else if (query.includes('ad_id') || query.includes('fb_pixel')) {
                    resolve('marketing');
                } else {
                    resolve('unknown');
                }
            } else {
                reject(new Error('Query no soportada'));
            }
        });
    }

    async getUserConsent(userId, cookieType) {
        try {
            const user = await User.findByPk(userId);
            if (!user) return false;
            const consentMap = {
                analytics: user.consent_analytics_cookies,
                marketing: user.consent_marketing_cookies,
                essential: true,
                performance: user.consent_performance_cookies || false
            };
            return consentMap[cookieType] ?? false;
        } catch (error) {
            throw new Error(`Error al obtener consentimiento: ${error.message}`);
        }
    }

    async canSetCookie(userId, cookieType) {
        let consentGivenForType = cookieType === 'essential' ? true : await this.getUserConsent(userId, cookieType);
        const query = `can_set_cookie(${cookieType}, ${consentGivenForType}).`;
        return this.executeQuery(query);
    }

    async requiresConsent(cookieType) {
        const query = `requires_consent(${cookieType}, Requires).`;
        const result = await this.executeQuery(query);
        return result;
    }

    async classifyCookie(cookieName) {
        const query = `classify_cookie(${cookieName}, Type).`;
        const result = await this.executeQuery(query);
        return result;
    }

    async pythonClassifyCookie(cookieName) {
        const { PythonShell } = require('python-shell');
        return new Promise((resolve, reject) => {
            PythonShell.run('cookie_classifier.py', { args: [cookieName] }, (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    async pythonAnalyzeCookies(cookieList) {
        const { PythonShell } = require('python-shell');
        return new Promise((resolve, reject) => {
            PythonShell.run('cookie_analyzer.py', { args: [JSON.stringify(cookieList)] }, (err, results) => {
                if (err) reject(err);
                else resolve(JSON.parse(results[0]));
            });
        });
    }
}

module.exports = new PrologService();