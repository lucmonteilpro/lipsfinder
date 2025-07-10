"""
FastAPI Backend pour Lips Finder
Point d'entrée principal de l'application
"""

from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
import stripe
from PIL import Image
import uuid
from pathlib import Path

# Charger les variables d'environnement
load_dotenv()

# Configuration
app = FastAPI(
    title="Lips Finder API",
    description="API pour la marketplace de photos de lèvres",
    version="1.0.0"
)

# Configuration CORS pour permettre au frontend de communiquer
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifier les domaines exacts
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Dossiers pour les fichiers
UPLOAD_FOLDER = Path("uploads")
UPLOAD_FOLDER.mkdir(exist_ok=True)

# ===== MODÈLES PYDANTIC =====
class User(BaseModel):
    """Modèle pour un utilisateur"""
    id: Optional[str] = None
    email: str
    username: str
    user_type: str  # "buyer" ou "seller"
    is_verified: bool = False

class Photo(BaseModel):
    """Modèle pour une photo"""
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    price: float
    seller_id: str
    category: str
    tags: List[str] = []
    file_path: Optional[str] = None
    is_active: bool = True

class PhotoUpload(BaseModel):
    """Modèle pour l'upload d'une photo"""
    title: str
    description: Optional[str] = None
    price: float
    category: str
    tags: List[str] = []

# ===== ROUTES PRINCIPALES =====

@app.get("/")
async def root():
    """Page d'accueil de l'API"""
    return {
        "message": "Bienvenue sur l'API Lips Finder",
        "version": "1.0.0",
        "documentation": "/docs"
    }

@app.get("/health")
async def health_check():
    """Vérification de l'état de l'API"""
    return {"status": "healthy", "service": "lips-finder-api"}

# ===== ROUTES UTILISATEURS =====

@app.post("/api/users/register")
async def register_user(user: User):
    """Inscription d'un nouvel utilisateur"""
    try:
        # Vérifier si l'email existe déjà
        # (Ici vous intégreriez avec Supabase)
        
        # Créer l'utilisateur
        user_id = str(uuid.uuid4())
        user.id = user_id
        
        # Sauvegarder dans la base de données
        # await save_user_to_database(user)
        
        return {
            "success": True,
            "message": "Utilisateur créé avec succès",
            "user_id": user_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/users/login")
async def login_user(email: str, password: str):
    """Connexion d'un utilisateur"""
    try:
        # Vérifier les identifiants
        # user = await authenticate_user(email, password)
        
        # Créer un token JWT
        # token = create_access_token(user.id)
        
        return {
            "success": True,
            "message": "Connexion réussie",
            "token": "jwt_token_here",
            "user_type": "buyer"  # ou "seller"
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Identifiants incorrects")

# ===== ROUTES PHOTOS =====

@app.get("/api/photos")
async def get_photos(
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None
):
    """Récupérer la liste des photos avec filtres"""
    try:
        # Filtrer les photos selon les critères
        # photos = await get_photos_from_database(category, min_price, max_price, search)
        
        # Exemple de données de retour
        sample_photos = [
            {
                "id": "photo_1",
                "title": "Lèvres rouges glossy",
                "description": "Photo professionnelle de lèvres rouges",
                "price": 2.00,
                "category": "glossy",
                "tags": ["rouge", "glossy", "professionnel"],
                "image_url": "/uploads/photo_1.jpg",
                "seller_username": "ruby_lips"
            },
            {
                "id": "photo_2",
                "title": "Look naturel",
                "description": "Lèvres naturelles sans maquillage",
                "price": 2.00,
                "category": "natural",
                "tags": ["naturel", "nude"],
                "image_url": "/uploads/photo_2.jpg",
                "seller_username": "natural_beauty"
            }
        ]
        
        return {
            "success": True,
            "data": sample_photos,
            "count": len(sample_photos)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/photos/upload")
async def upload_photo(
    file: UploadFile = File(...),
    photo_data: PhotoUpload = Depends()
):
    """Upload d'une nouvelle photo par un vendeur"""
    try:
        # Vérifier que c'est une image
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Le fichier doit être une image")
        
        # Générer un nom de fichier unique
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = UPLOAD_FOLDER / unique_filename
        
        # Sauvegarder le fichier
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Traiter l'image (redimensionner, optimiser)
        await process_image(file_path)
        
        # Créer l'entrée en base de données
        photo_id = str(uuid.uuid4())
        photo = Photo(
            id=photo_id,
            title=photo_data.title,
            description=photo_data.description,
            price=photo_data.price,
            seller_id="current_user_id",  # À récupérer du token JWT
            category=photo_data.category,
            tags=photo_data.tags,
            file_path=str(file_path)
        )
        
        # Sauvegarder en base
        # await save_photo_to_database(photo)
        
        return {
            "success": True,
            "message": "Photo uploadée avec succès",
            "photo_id": photo_id,
            "image_url": f"/uploads/{unique_filename}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== ROUTES PAIEMENTS =====

@app.post("/api/payments/create-payment-intent")
async def create_payment_intent(photo_id: str, amount: float):
    """Créer une intention de paiement Stripe"""
    try:
        # Créer l'intention de paiement
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Stripe utilise les centimes
            currency='eur',
            metadata={
                'photo_id': photo_id,
                'type': 'photo_purchase'
            }
        )
        
        return {
            "success": True,
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/payments/confirm-purchase")
async def confirm_purchase(payment_intent_id: str, photo_id: str):
    """Confirmer l'achat d'une photo"""
    try:
        # Vérifier le paiement auprès de Stripe
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        # Pour la démo, on simule un paiement réussi
        # Dans la vraie vie, vous vérifieriez intent.status == "succeeded"
        
        # Enregistrer l'achat en base
        purchase_id = str(uuid.uuid4())
        
        # Créer le lien de téléchargement
        download_url = f"http://localhost:8000/api/photos/{photo_id}/download?token={purchase_id}"
        
        return {
            "success": True,
            "message": "Achat confirmé",
            "purchase_id": purchase_id,
            "download_url": download_url
        }
            
    except Exception as e:
        print(f"Erreur confirmation achat: {e}")
        return {
            "success": False,
            "message": f"Erreur: {str(e)}"
        }

# ===== FONCTIONS UTILITAIRES =====

async def process_image(file_path: Path):
    """Traiter une image (redimensionner, optimiser)"""
    try:
        with Image.open(file_path) as img:
            # Redimensionner si trop grande
            max_size = (2048, 2048)
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Optimiser et sauvegarder
            img.save(file_path, optimize=True, quality=85)
            
    except Exception as e:
        print(f"Erreur lors du traitement de l'image: {e}")

# ===== SERVIR LES FICHIERS STATIQUES =====

# Servir les images uploadées
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Servir le frontend (optionnel) - COMMENTÉ TEMPORAIREMENT
# app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")

# ===== DÉMARRAGE =====

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Recharger automatiquement en développement
        log_level="info"
    )