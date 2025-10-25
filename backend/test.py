# main.py
from supabase_client import WishManager

def main():
    db = WishManager()
    
    # Crear un usuario
    user = db.create_user("zapato", "password123", 1000.0)
    print(f"Usuario creado: {user['username']} con ${user['money']}")

    # Crear deseos para el usuario
    wish1 = db.create_wish(
        user_id=user["id"],
        name="Nueva Bicicleta",
        description="Una bicicleta de montaña para hacer ejercicio",
        money_goal=500.0,
        percentage=0.5
    )

    wish2 = db.create_wish(
        user_id=user["id"],
        name="Viaje a la Playa",
        description="Fin de semana en la costa",
        money_goal=300.0,
        percentage=0.5
    )
    
    print("Deseos creados exitosamente!")

     # Agregar dinero a los deseos
    db.add_money_to_wish(wish1[7], 200.0)
    
if __name__ == "__main__":
    main()
