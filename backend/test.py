# main.py
from supabase_client import WishManager

def main():
    db = WishManager()
    
    # Crear un usuario
    user = db.create_user("b", "password123", 1230.0)
    print(f"Usuario creado: {user['username']} con ${user['money']}")

    # Crear deseos para el usuario
    wish1 = db.create_wish(
        user_id=user["id"],
        name="carro",
        description="Un carro deportivo rojo",
        money_goal=500.0,
        percentage=0.8
    )

    wish2 = db.create_wish(
        user_id=user["id"],
        name="Sudadera",
        description="Una sudadera cómoda para el invierno",
        money_goal=300.0,
        percentage=0.5
    )

    print("Deseos creados exitosamente!")
    
    # userTest = db.get_user_by_username("t")
    # wishes = db.get_wishes_by_user(userTest["id"])
    # # update wish percentage
    # print("Actualizando porcentaje del primer deseo al 0.7")
    # updated_wish = db.update_wish(
    #     wish_id=wishes[0]["id"],
    #     updates={"percentage": 0.7}
    # )
    



    
if __name__ == "__main__":
    main()
