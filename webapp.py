from flask import Flask, render_template_string, request
import requests

app = Flask(__name__)

TEMPLATE = '''
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Gestión de Cookies</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: #f8f9fa; }
        .container { max-width: 700px; margin-top: 40px; }
        pre { background: #e9ecef; padding: 10px; }
    </style>
</head>
<body>
<div class="container">
    <h2 class="mb-4 text-center">Gestión de Cookies (Flask)</h2>
    {% if alert %}
    <div class="alert alert-{{ alert_type }} alert-dismissible fade show" role="alert">
        {{ alert }}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
    {% endif %}

    <form method="post" class="card card-body mb-4">
        <h4>Establecer Cookie</h4>
        <input type="hidden" name="action" value="set-cookie">
        <div class="mb-2">
            <label class="form-label">Nombre</label>
            <input class="form-control" name="name" value="session_id" readonly>
        </div>
        <div class="mb-2">
            <label class="form-label">Valor</label>
            <input class="form-control" name="value" value="abc123" readonly>
        </div>
        <div class="mb-2">
            <label class="form-label">Tipo</label>
            <select class="form-select" name="type">
                <option value="essential">Essential</option>
                <option value="analytics">Analytics</option>
                <option value="marketing">Marketing</option>
                <option value="performance">Performance</option>
            </select>
        </div>
        <div class="mb-2">
            <label class="form-label">User ID</label>
            <input class="form-control" name="userId" type="number" value="1" readonly>
        </div>
        <button class="btn btn-primary mt-2" type="submit">Establecer</button>
    </form>

    <form method="post" class="card card-body mb-4">
        <h4>Actualizar Consentimiento</h4>
        <input type="hidden" name="action" value="update-consent">
        <div class="mb-2">
            <label class="form-label">User ID</label>
            <input class="form-control" name="userId" type="number" value="1" readonly>
        </div>
        <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" name="analytics" id="analytics">
            <label class="form-check-label" for="analytics">Analytics</label>
        </div>
        <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" name="marketing" id="marketing">
            <label class="form-check-label" for="marketing">Marketing</label>
        </div>
        <button class="btn btn-success mt-2" type="submit">Actualizar</button>
    </form>

    <form method="post" class="card card-body mb-4">
        <h4>Clasificar Cookie</h4>
        <input type="hidden" name="action" value="classify-cookie">
        <div class="mb-2">
            <label class="form-label">Nombre de la cookie</label>
            <input class="form-control" name="cookieName" value="session_id" readonly>
        </div>
        <button class="btn btn-info mt-2" type="submit">Clasificar</button>
    </form>

    <form method="post" class="card card-body mb-4">
        <h4>Verificar Consentimiento Requerido</h4>
        <input type="hidden" name="action" value="check-consent">
        <div class="mb-2">
            <label class="form-label">Tipo de cookie</label>
            <select class="form-select" name="cookieType">
                <option value="essential">Essential</option>
                <option value="analytics">Analytics</option>
                <option value="marketing">Marketing</option>
                <option value="performance">Performance</option>
            </select>
        </div>
        <button class="btn btn-warning mt-2" type="submit">Verificar</button>
    </form>

    <form method="post" class="card card-body mb-4">
        <h4>Mostrar Cookies guardadas en el servidor</h4>
        <input type="hidden" name="action" value="get-cookies">
        <button class="btn btn-secondary mb-2" type="submit">Mostrar cookies</button>
    </form>

    <div class="card card-body mt-4">
        <h4>Resultado</h4>
        <pre>{{ result }}</pre>
    </div>
</div>
</body>
</html>
'''

API = 'http://localhost:3000'

@app.route('/', methods=['GET', 'POST'])
def index():
    result = ''
    alert = ''
    alert_type = 'success'
    if request.method == 'POST':
        action = request.form.get('action')
        try:
            if action == 'set-cookie':
                data = {
                    'name': request.form['name'],
                    'value': request.form['value'],
                    'type': request.form['type'],
                    'userId': request.form['userId']
                }
                r = requests.post(f'{API}/set-cookie', json=data)
                result = r.text
                alert = 'Cookie establecida correctamente.' if r.ok else 'Error al establecer la cookie.'
                alert_type = 'success' if r.ok else 'danger'
            elif action == 'update-consent':
                data = {
                    'userId': request.form['userId'],
                    'analytics': 'analytics' in request.form,
                    'marketing': 'marketing' in request.form
                }
                r = requests.post(f'{API}/update-consent', json=data)
                result = r.text
                alert = 'Consentimiento actualizado.' if r.ok else 'Error al actualizar consentimiento.'
                alert_type = 'success' if r.ok else 'danger'
            elif action == 'classify-cookie':
                cookieName = request.form['cookieName']
                r = requests.get(f'{API}/classify-cookie/{cookieName}')
                result = r.text
                alert = 'Clasificación realizada.' if r.ok else 'Error al clasificar la cookie.'
                alert_type = 'success' if r.ok else 'danger'
            elif action == 'check-consent':
                cookieType = request.form['cookieType']
                r = requests.get(f'{API}/check-consent/{cookieType}')
                result = r.text
                alert = 'Consulta realizada.' if r.ok else 'Error al consultar consentimiento.'
                alert_type = 'success' if r.ok else 'danger'
            elif action == 'get-cookies':
                r = requests.get(f'{API}/get-cookies')
                result = r.text
                alert = 'Cookies obtenidas.' if r.ok else 'Error al obtener cookies.'
                alert_type = 'info' if r.ok else 'danger'
        except Exception as e:
            result = str(e)
            alert = 'Error de conexión o datos.'
            alert_type = 'danger'
    return render_template_string(TEMPLATE, result=result, alert=alert, alert_type=alert_type)

if __name__ == '__main__':
    app.run(port=5000, debug=True)