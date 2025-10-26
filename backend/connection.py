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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
