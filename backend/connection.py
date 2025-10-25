from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Permite peticiones desde el frontend

# Ruta de prueba GET
@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify({'message': 'Hola desde Flask!'})

# Ruta de ejemplo POST
@app.route('/api/data', methods=['POST'])
def receive_data():
    data = request.get_json()
    return jsonify({
        'received': data,
        'status': 'success'
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
