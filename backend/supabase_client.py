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
    
    def create_wish(self, user_id: int, name: str, description: str, 
                    money_goal: float, current_money: float = 0, percentage: float= 0) -> Dict[str, Any]:
        """Crear un nuevo deseo"""
        percentage = (current_money / money_goal * 100) if money_goal > 0 else 0
        
        data = {
            "user_id": user_id,
            "name": name,
            "description": description,
            "percentage": percentage,
            "money_goal": money_goal,
            "current_money": current_money
        }
        
        response = self.client.table("Wishes").insert(data).execute()
        return response.data[0] if response.data else None
    
    def get_wishes_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        """Obtener todos los deseos de un usuario"""
        response = self.client.table("Wishes").select("*").eq("user_id", user_id).execute()
        return response.data
    
    def get_wish_by_id(self, wish_id: int) -> Optional[Dict[str, Any]]:
        """Obtener un deseo por ID"""
        response = self.client.table("Wishes").select("*").eq("id", wish_id).execute()
        return response.data[0] if response.data else None
    
    def update_wish_money(self, wish_id: int, new_money: float) -> Dict[str, Any]:
        """Actualizar el dinero actual de un deseo y recalcular porcentaje"""
        wish = self.get_wish_by_id(wish_id)
        if not wish:
            raise ValueError("Wish not found")
        
        percentage = (new_money / wish["money_goal"] * 100) if wish["money_goal"] > 0 else 0
        
        update_data = {
            "current_money": new_money,
            "percentage": percentage
        }
        
        response = self.client.table("Wishes").update(update_data).eq("id", wish_id).execute()
        return response.data[0] if response.data else None
    
    def add_money_to_wish(self, wish_id: int, amount: float) -> Dict[str, Any]:
        """Agregar dinero a un deseo existente"""
        wish = self.get_wish_by_id(wish_id)
        if not wish:
            raise ValueError("Wish not found")
        
        new_money = wish["current_money"] + amount
        return self.update_wish_money(wish_id, new_money)
    
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
