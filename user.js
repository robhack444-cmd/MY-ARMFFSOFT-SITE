import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { UserService } from '../services/user.service'
import { CryptoUtils } from '../utils/crypto'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const isAuthenticated = ref(false)
  const permissions = ref([])
  const session = ref(null)
  
  // Getters
  const isPremium = computed(() => user.value?.subscription?.isActive)
  const canPurchase = computed(() => isAuthenticated.value && user.value?.verified)
  const userTier = computed(() => user.value?.tier || 'free')
  
  // Actions
  const initialize = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        await loadUserProfile()
        await validateSession()
      }
    } catch (error) {
      console.error('Initialization failed:', error)
      logout()
    }
  }
  
  const loadUserProfile = async () => {
    const profile = await UserService.getProfile()
    user.value = profile
    isAuthenticated.value = true
    permissions.value = profile.permissions || []
  }
  
  const login = async (credentials) => {
    const { user: userData, token, session: userSession } = await UserService.login(credentials)
    
    // Secure storage
    localStorage.setItem('auth_token', CryptoUtils.encrypt(token))
    sessionStorage.setItem('user_session', CryptoUtils.encrypt(JSON.stringify(userSession)))
    
    user.value = userData
    isAuthenticated.value = true
    session.value = userSession
    
    // Start session monitoring
    startSessionMonitoring()
  }
  
  const logout = () => {
    localStorage.removeItem('auth_token')
    sessionStorage.removeItem('user_session')
    user.value = null
    isAuthenticated.value = false
    session.value = null
  }
  
  const startSessionMonitoring = () => {
    setInterval(async () => {
      try {
        await UserService.validateSession()
      } catch (error) {
        console.warn('Session invalid, logging out...')
        logout()
      }
    }, 60000) // Check every minute
  }
  
  const validateSession = async () => {
    if (!session.value) return false
    
    const isValid = await UserService.validateSession()
    if (!isValid) {
      logout()
      return false
    }
    
    return true
  }
  
  return {
    user,
    isAuthenticated,
    permissions,
    session,
    isPremium,
    canPurchase,
    userTier,
    initialize,
    login,
    logout,
    validateSession
  }
})