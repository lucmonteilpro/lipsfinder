// Configuration Supabase pour Lips Finder
import { createClient } from '@supabase/supabase-js'

// Remplacez par vos vraies valeurs depuis le dashboard Supabase
const supabaseUrl = 'https://your-project-id.supabase.co'
const supabaseKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Fonctions utilitaires pour l'authentification
export const auth = {
  // Inscription
  async signUp(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData // username, user_type, display_name
      }
    })
    return { data, error }
  },

  // Connexion
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Déconnexion
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Obtenir l'utilisateur actuel
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Écouter les changements d'état d'authentification
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Fonctions pour les photos
export const photos = {
  // Récupérer toutes les photos
  async getAll() {
    const { data, error } = await supabase
      .from('photos')
      .select(`
        *,
        users!seller_id (username, display_name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // Récupérer les photos d'un vendeur
  async getBySeller(sellerId) {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // Chercher des photos
  async search(query, category = null) {
    let queryBuilder = supabase
      .from('photos')
      .select(`
        *,
        users!seller_id (username, display_name)
      `)
      .eq('is_active', true)
    
    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    }
    
    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }
    
    const { data, error } = await queryBuilder.order('created_at', { ascending: false })
    return { data, error }
  },

  // Incrémenter les vues
  async incrementViews(photoId) {
    const { error } = await supabase.rpc('increment_photo_views', {
      photo_id: photoId
    })
    return { error }
  },

  // Ajouter une photo
  async create(photoData) {
    const { data, error } = await supabase
      .from('photos')
      .insert([photoData])
      .select()
    
    return { data, error }
  }
}

// Fonctions pour les favoris
export const favorites = {
  // Ajouter aux favoris
  async add(photoId) {
    const user = await auth.getCurrentUser()
    if (!user) return { error: 'Not authenticated' }
    
    const { data, error } = await supabase
      .from('favorites')
      .insert([{ user_id: user.id, photo_id: photoId }])
    
    return { data, error }
  },

  // Retirer des favoris
  async remove(photoId) {
    const user = await auth.getCurrentUser()
    if (!user) return { error: 'Not authenticated' }
    
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('photo_id', photoId)
    
    return { error }
  },

  // Récupérer les favoris d'un utilisateur
  async getUserFavorites() {
    const user = await auth.getCurrentUser()
    if (!user) return { data: [], error: 'Not authenticated' }
    
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        photos (
          *,
          users!seller_id (username, display_name)
        )
      `)
      .eq('user_id', user.id)
    
    return { data, error }
  }
}

// Fonctions pour les achats
export const purchases = {
  // Créer un achat
  async create(photoId, amount) {
    const user = await auth.getCurrentUser()
    if (!user) return { error: 'Not authenticated' }
    
    // Récupérer les infos de la photo
    const { data: photo } = await supabase
      .from('photos')
      .select('seller_id')
      .eq('id', photoId)
      .single()
    
    if (!photo) return { error: 'Photo not found' }
    
    const platformFee = amount * 0.20 // 20% commission
    const sellerEarning = amount - platformFee
    
    const { data, error } = await supabase
      .from('purchases')
      .insert([{
        buyer_id: user.id,
        seller_id: photo.seller_id,
        photo_id: photoId,
        amount: amount,
        platform_fee: platformFee,
        seller_earning: sellerEarning
      }])
    
    // Incrémenter le compteur de ventes
    if (!error) {
      await supabase
        .from('photos')
        .update({ sales_count: supabase.raw('sales_count + 1') })
        .eq('id', photoId)
    }
    
    return { data, error }
  },

  // Récupérer les achats d'un utilisateur
  async getUserPurchases() {
    const user = await auth.getCurrentUser()
    if (!user) return { data: [], error: 'Not authenticated' }
    
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        photos (
          *,
          users!seller_id (username, display_name)
        )
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // Récupérer les ventes d'un vendeur
  async getSellerSales() {
    const user = await auth.getCurrentUser()
    if (!user) return { data: [], error: 'Not authenticated' }
    
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        photos (title, image_url),
        users!buyer_id (username, display_name)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
    
    return { data, error }
  }
}

// Fonctions pour le stockage
export const storage = {
  // Uploader une image
  async uploadImage(file, userId) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('photos')
      .upload(fileName, file)
    
    if (error) return { error }
    
    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName)
    
    return { data: { fileName, publicUrl }, error: null }
  },

  // Supprimer une image
  async deleteImage(fileName) {
    const { error } = await supabase.storage
      .from('photos')
      .remove([fileName])
    
    return { error }
  }
}

// Fonctions pour les utilisateurs
export const users = {
  // Récupérer le profil utilisateur
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { data, error }
  },

  // Mettre à jour le profil
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
    
    return { data, error }
  }
}