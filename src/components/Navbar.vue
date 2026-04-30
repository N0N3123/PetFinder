<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-success fixed-top">
    <div class="container-fluid">

      <router-link class="navbar-brand fw-bold" to="/">
        🐾 PetFinder
      </router-link>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/">Mapa</router-link>
          </li>
          <template v-if="user">
            <li class="nav-item">
              <router-link class="nav-link" to="/profile">Profil</router-link>
            </li>
            <li class="nav-item">
              <button class="btn btn-link nav-link" @click="logout">Wyloguj</button>
            </li>
          </template>
          <template v-else>
            <li class="nav-item">
              <router-link class="nav-link" to="/login">Zaloguj się</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/register">Zarejestruj się</router-link>
            </li>
          </template>
        </ul>
      </div>

    </div>
  </nav>
</template>

<script setup>
import { useAuth } from '../composables/useAuth'

const { user, logout } = useAuth()
</script>
