# supabase_client.py
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import List, Optional, Dict, Any

load_dotenv()

class WishManager:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")
        self.client: Client = create_client(self.url, self.key)
    
    # ===== OPERACIONES PARA WISHES =====
   
    def create_wish(self, user_id: int, name: str, description: str, money_goal: float, percentage: float) -> Dict[str, Any]:
        # Crear el nuevo deseo
        new_wish = {
            "user_id": user_id,
            "name": name,
            "description": description,
            "money_goal": money_goal,
            "percentage": percentage,
            "current_money": 0.0
        }
        response = self.client.table("Wishes").insert(new_wish).execute()
        created_wish = response.data[0] if response.data else None
        
        if created_wish:
            # Conseguir wishes del usuario
            wishes = self.get_wishes_by_user(user_id)
            # Calcular cuánto distribuir entre los otros wishes
            distribute = 1 - percentage
            total_percentage = sum(wish["percentage"] for wish in wishes if wish["id"] != created_wish["id"])
            
            # Actualizar cada wish en un loop
            for wish in wishes:
                if wish["id"] != created_wish["id"]:
                    adjusted_percentage = (wish["percentage"] / total_percentage) * distribute
                    self.update_wish(wish["id"], {"percentage": adjusted_percentage})

        return created_wish

    def get_wishes_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        """Obtener todos los deseos de un usuario"""
        response = self.client.table("Wishes").select("*").eq("user_id", user_id).execute()
        return response.data

    def update_wish(self, wish_id: int, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Actualizar un deseo con los datos proporcionados"""
        response = self.client.table("Wishes").update(updates).eq("id", wish_id).execute()
        return response.data[0] if response.data else None

    def get_wish_by_id(self, wish_id: int) -> Dict[str, Any]:
        """Obtener un deseo por su ID"""
        response = self.client.table("Wishes").select("*").eq("id", wish_id).execute()
        return response.data[0] if response.data else None
    
    def update_wish_percentage(self, user_id: int, wish_id: int, new_percentage: float) -> Dict[str, Any]:
        # Conseguir wishes del usuario
        wishes = self.get_wishes_by_user(user_id)
        # Calcular cuánto distribuir entre los otros wishes
        distribute = 1 - new_percentage
        total_percentage = sum(wish["percentage"] for wish in wishes if wish["id"] != wish_id)
        
        # Actualizar cada wish en un loop
        for wish in wishes:
            if wish["id"] != wish_id:
                adjusted_percentage = (wish["percentage"] / total_percentage) * distribute
                self.update_wish(wish["id"], {"percentage": adjusted_percentage})
        
        # Finalmente actualizar el wish objetivo
        return self.update_wish(wish_id, {"percentage": new_percentage})
    
    def delete_wish(self, wish_id: int) -> bool:
        """Eliminar un deseo"""
        response = self.client.table("Wishes").delete().eq("id", wish_id).execute()
        return len(response.data) > 0
    
    def get_completed_wishes(self, user_id: int) -> List[Dict[str, Any]]:
        """Obtener deseos completados (percentage >= 100)"""
        response = (self.client.table("Wishes")
                   .select("*")
                   .eq("user_id", user_id)
                   .gte("percentage", 100)
                   .execute())
        return response.data
    
    # ===== OPERACIONES PARA USERS =====
    
    def create_user(self, username: str, password: str, money: float = 0) -> Dict[str, Any]:
        """Crear un nuevo usuario"""
        data = {
            "username": username,
            "password": password,  # En producción, esto debería estar hasheado
            "money": money
        }
        
        response = self.client.table("Users").insert(data).execute()
        return response.data[0] if response.data else None
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Obtener usuario por ID"""
        response = self.client.table("Users").select("*").eq("id", user_id).execute()
        return response.data[0] if response.data else None
    
    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Obtener usuario por username"""
        response = self.client.table("Users").select("*").eq("username", username).execute()
        return response.data[0] if response.data else None
    
    def update_user_money(self, user_id: int, new_money: float) -> Dict[str, Any]:
        """Actualizar dinero del usuario"""
        response = self.client.table("Users").update({"money": new_money}).eq("id", user_id).execute()
        return response.data[0] if response.data else None
    
    def add_money_to_user(self, user_id: int, amount: float) -> Dict[str, Any]:
        """Agregar dinero al usuario"""
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        new_money = user["money"] + amount
        return self.update_user_money(user_id, new_money)
    
    # ===== OPERACIONES COMBINADAS =====
    
    def get_user_with_wishes(self, user_id: int) -> Dict[str, Any]:
        """Obtener usuario con todos sus deseos"""
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        wishes = self.get_wishes_by_user(user_id)
        user["wishes"] = wishes
        return user
    
    def transfer_money_to_wish(self, user_id: int, wish_id: int, amount: float) -> Dict[str, Any]:
        """Transferir dinero del usuario a un deseo"""
        user = self.get_user_by_id(user_id)
        wish = self.get_wish_by_id(wish_id)
        
        if not user or not wish:
            raise ValueError("User or wish not found")
        
        if user["money"] < amount:
            raise ValueError("Insufficient funds")
        
        # Actualizar dinero del usuario
        self.update_user_money(user_id, user["money"] - amount)
        
        # Agregar dinero al deseo
        updated_wish = self.add_money_to_wish(wish_id, amount)
        
        return updated_wish
