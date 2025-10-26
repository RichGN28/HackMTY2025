# main.py
from supabase_client import WishManager

def main():
    db = WishManager()
    
    # Crear un usuario
    # user = db.create_user("a", "password123", 1230.0)
    # print(f"Usuario creado: {user['username']} con ${user['money']}")

    # user = db.get_user_by_username("d")

    # wish1 = db.create_wish(
    #     user_id=user["id"],
    #     name="sermon",
    #     description="Un carro deportivo rojo",
    #     money_goal=500.0,
    #     percentage=0.2,
    #     plazo="2024-12-31"
    # )

    # wish2 = db.create_wish(
    #     user_id=user["id"],
    #     name="Sudadera",
    #     description="Una sudadera cómoda para el invierno",
    #     money_goal=300.0,
    #     percentage=0.5,
    #     plazo="2024-11-30"
    # )
    # wish3 = db.create_wish(
    #     user_id=user["id"],
    #     name="tractor",
    #     description="ostia chaval",
    #     money_goal=500.0,
    #     percentage=0.2,
    #     plazo="2024-10-15"
    # )
    # print("Deseos creados exitosamente!")
    
    userTest = db.get_user_by_username("a")
    wishes = db.get_wishes_by_user(userTest["id"])
    # update wish percentage
    print("Actualizando porcentaje del primer deseo al 0.7")
    updated_wish = db.update_wish_percentage(
        user_id=userTest["id"],
        wish_id=wishes[0]["id"],
        new_percentage=0.7
    )

if __name__ == "__main__":
    main()
