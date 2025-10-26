from flask import Flask, jsonify, request # type: ignore
from flask_cors import CORS # type: ignore
from supabase_client import WishManager

db = WishManager()

app = Flask(__name__)
CORS(app)  # Permite peticiones desde el frontend
CORS(app, resources={r"/*": {"origins": "http://localhost:5500"}}) 

@app.route('/frontend/homepage', methods=['GET'])
def homepage():
    return jsonify({'message': 'Hola desde Flask!'})

@app.route('/frontend/loginpage', methods=['POST'])
def loginpage():
    data = request.get_json()
    print(data)
    return jsonify({
        'received': data,
        'status': 'success'
    })


@app.route('/frontend/chatpage', methods=['POST'])
def chatpage():
    data = request.get_json()
    print(data)
    user = db.get_user_by_id(data.get('user_id'))
    wish = db.create_wish(
        user_id=user['id'],
        name=data.get('name'),
        description=data.get('description'),
        money_goal=data.get('money_goal'),
        percentage=data.get('percentage'),
        plazo=data.get('plazo')
    )
    return jsonify({
        'created_wish': wish,
        'status': 'wish created successfully'
    })

@app.route('/api/deposito', methods=['POST'])
def deposito():
    try:
        data = request.get_json()
        user_id = data.get('user_id', 38)  # Por defecto usuario 38
        cantidad = float(data.get('cantidad', 0))
        
        if cantidad <= 0:
            return jsonify({
                'status': 'error',
                'message': 'La cantidad debe ser mayor a 0'
            }), 400
        
        # Obtener usuario actual
        user = db.get_user_by_id(user_id)
        
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'Usuario no encontrado'
            }), 404
        
        # Sumar la cantidad al dinero actual
        nuevo_saldo = user.get('money', 0) + cantidad
        
        # Actualizar en la BD
        usuario_actualizado = db.update_user_money(user_id, nuevo_saldo)
        
        return jsonify({
            'status': 'success',
            'message': f'Depósito de ${cantidad} realizado',
            'nuevo_saldo': nuevo_saldo,
            'usuario': usuario_actualizado
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/retiro', methods=['POST'])
def retiro():
    try:
        data = request.get_json()
        user_id = data.get('user_id', 38)  # Por defecto usuario 38
        cantidad = float(data.get('cantidad', 0))
        
        if cantidad <= 0:
            return jsonify({
                'status': 'error',
                'message': 'La cantidad debe ser mayor a 0'
            }), 400
        
        # Obtener usuario actual
        user = db.get_user_by_id(user_id)
        
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'Usuario no encontrado'
            }), 404
        
        saldo_actual = user.get('money', 0)
        
        if saldo_actual < cantidad:
            return jsonify({
                'status': 'error',
                'message': 'Saldo insuficiente'
            }), 400
        
        # Restar la cantidad del dinero actual
        nuevo_saldo = saldo_actual - cantidad
        
        # Actualizar en la BD
        usuario_actualizado = db.update_user_money(user_id, nuevo_saldo)
        
        return jsonify({
            'status': 'success',
            'message': f'Retiro de ${cantidad} realizado',
            'nuevo_saldo': nuevo_saldo,
            'usuario': usuario_actualizado
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/saldo/<user_id>', methods=['GET'])
def obtener_saldo(user_id):
    try:
        user = db.get_user_by_id(user_id)
        
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'Usuario no encontrado'
            }), 404
        
        saldo = user.get('money', 0)
        
        return jsonify({
            'status': 'success',
            'user_id': user_id,
            'saldo': saldo,
            'usuario': user
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
