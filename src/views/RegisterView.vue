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
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { register, error, loading } = useAuth()

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
  if (!error.value) router.push('/')
}
</script>
