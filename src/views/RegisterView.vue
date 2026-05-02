<template>
  <div class="container form-page">
    <div class="card auth-card shadow">
      <div class="card-body p-4">
        <h3 class="text-center mb-4">🐾 Rejestracja</h3>

        <form @submit.prevent="handleRegister">
          <div class="mb-3">
            <label for="displayName" class="form-label">Imię / Nick</label>
            <input
              v-model="displayName"
              type="text"
              id="displayName"
              class="form-control"
              placeholder="Jan Kowalski"
              required
            />
          </div>
          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input
              v-model="email"
              type="email"
              id="email"
              class="form-control"
              placeholder="twoj@email.pl"
              required
              autocomplete="email"
            />
          </div>
          <div class="mb-3">
            <label for="password" class="form-label">Hasło</label>
            <input
              v-model="password"
              type="password"
              id="password"
              class="form-control"
              placeholder="Min. 6 znaków"
              required
              minlength="6"
              autocomplete="new-password"
            />
          </div>
          <div class="mb-3">
            <label for="confirmPassword" class="form-label">Powtórz hasło</label>
            <input
              v-model="confirmPassword"
              type="password"
              id="confirmPassword"
              class="form-control"
              placeholder="Powtórz hasło"
              required
              autocomplete="new-password"
            />
          </div>
          <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
          <button type="submit" class="btn btn-success w-100 mb-3" :disabled="loading">
            {{ loading ? 'Rejestracja...' : 'Zarejestruj się' }}
          </button>
        </form>

        <div class="text-center mb-3">
          <span class="text-muted">lub</span>
        </div>
        <button @click="handleGoogle" :disabled="loading" class="btn btn-outline-dark w-100 mb-3 d-flex align-items-center justify-content-center gap-2">
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Zarejestruj przez Google
        </button>

        <p class="text-center text-muted mb-0">
          Masz już konto?
          <router-link to="/login">Zaloguj się</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const route = useRoute()
const { register, loginWithGoogle, error, loading } = useAuth()

const displayName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    alert('Hasła nie są takie same.')
    return
  }
  await register(email.value, password.value, displayName.value)
  if (!error.value) {
    const redirectPath = route.query.redirect || '/'
    router.push(redirectPath)
  }
}

const handleGoogle = async () => {
  await loginWithGoogle()
  if (!error.value) {
    const redirectPath = route.query.redirect || '/'
    router.push(redirectPath)
  }
}
</script>
