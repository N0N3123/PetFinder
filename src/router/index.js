import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { auth } from '../firebase/config'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { guestOnly: true }
  },
  // --- CHRONIONE ---
  {
    path: '/create',
    name: 'Create',
    component: () => import('../views/CreateAnnouncementView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('../views/MessagesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const loggedIn = !!auth.currentUser
  
  // Jeśli trasa wymaga logowania, a user nie jest zalogowany -> na stronę logowania
  if (to.meta.requiresAuth && !loggedIn) {
    return '/login'
  }
  
  // Jeśli trasa jest tylko dla gości (np. /login), a user jest zalogowany -> na stronę główną
  if (to.meta.guestOnly && loggedIn) {
    return '/'
  }
})

export default router