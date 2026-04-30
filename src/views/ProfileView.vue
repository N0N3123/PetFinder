<template>
  <div class="container mt-5 pt-4 form-page">
    <div class="card shadow" style="max-width: 500px; margin: 0 auto;">
      <div class="card-body text-center p-5">
        <div class="mb-4">
          <img 
            :src="user?.photoURL || 'https://ui-avatars.com/api/?name=' + (user?.displayName || 'User') + '&background=198754&color=fff'" 
            alt="Profilowe" 
            class="rounded-circle border border-3 border-success shadow"
            style="width: 120px; height: 120px; object-fit: cover;"
          />
        </div>
        
        <h3 class="mb-1">{{ user?.displayName || 'Użytkownik' }}</h3>
        <p class="text-muted mb-4">{{ user?.email }}</p>
        
        <button @click="handleLogout" class="btn btn-outline-danger w-100">
          Wyloguj się
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '../composables/useAuth'
import { useRouter } from 'vue-router'

const { user, logout } = useAuth()
const router = useRouter()

const handleLogout = async () => {
  await logout()
  router.push('/login')
}
</script>