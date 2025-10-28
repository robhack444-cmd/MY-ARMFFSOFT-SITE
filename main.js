import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// Store Management
const pinia = createPinia()

// Router Configuration
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./views/Home.vue') },
    { path: '/products', component: () => import('./views/Products.vue') },
    { path: '/product/:id', component: () => import('./views/ProductDetail.vue') },
    { path: '/checkout', component: () => import('./views/Checkout.vue') },
    { path: '/dashboard', component: () => import('./views/Dashboard.vue') },
    { path: '/support', component: () => import('./views/Support.vue') }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  }
})

// Global Components
const app = createApp(App)
app.use(pinia)
app.use(router)

// Directives
app.directive('lazy', {
  mounted(el, binding) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          el.src = binding.value
          observer.unobserve(el)
        }
      })
    })
    observer.observe(el)
  }
})

app.mount('#app')