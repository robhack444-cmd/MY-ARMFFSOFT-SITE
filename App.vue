<template>
  <div id="app" :class="{ 'menu-open': isMenuOpen }">
    <AppHeader @toggle-menu="isMenuOpen = !isMenuOpen" />
    <SideNavigation :is-open="isMenuOpen" @close="isMenuOpen = false" />
    
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <AppFooter />
    <LiveSupportWidget />
    <NotificationContainer />
    
    <!-- 3D Background -->
    <CanvasBackground />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useUserStore } from './stores/user'
import AppHeader from './components/Layout/AppHeader.vue'
import SideNavigation from './components/Layout/SideNavigation.vue'
import AppFooter from './components/Layout/AppFooter.vue'
import LiveSupportWidget from './components/Widgets/LiveSupport.vue'
import NotificationContainer from './components/UI/NotificationContainer.vue'
import CanvasBackground from './components/Effects/CanvasBackground.vue'

export default {
  name: 'App',
  components: {
    AppHeader, SideNavigation, AppFooter,
    LiveSupportWidget, NotificationContainer, CanvasBackground
  },
  setup() {
    const isMenuOpen = ref(false)
    const userStore = useUserStore()
    
    onMounted(async () => {
      // Initialize app
      await userStore.initialize()
      
      // Register service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('SW registered:', reg))
          .catch(err => console.log('SW registration failed:', err))
      }
    })
    
    return { isMenuOpen }
  }
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  position: relative;
}

.main-content {
  min-height: calc(100vh - 140px);
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>