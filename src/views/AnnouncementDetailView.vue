<template>
  <div class="container form-page">
    <div class="card auth-card shadow">
      <div v-if="announcement" class="card-body p-4">
        <button class="btn btn-outline-secondary btn-sm mb-3 shadow-sm" @click="$router.push('/')">
  ← Wróć do mapy
</button>

        <div v-if="announcement.imageUrls?.[0]" class="mb-3">
          <img :src="announcement.imageUrls[0]" class="w-100 rounded" style="max-height:300px;object-fit:cover;" />
        </div>

        <div class="d-flex align-items-center gap-2 mb-2">
          <span class="badge" :class="announcement.type === 'lost' ? 'bg-danger' : 'bg-success'">
            {{ announcement.type === 'lost' ? 'Zaginione 🔴' : 'Do adopcji 🟢' }}
          </span>
          <h4 class="mb-0">{{ announcement.petName }}</h4>
        </div>

        <p class="text-muted mb-1">{{ announcement.petType }}{{ announcement.breed ? ' · ' + announcement.breed : '' }}</p>
        <p v-if="announcement.description" class="mb-3">{{ announcement.description }}</p>

        <div class="d-flex align-items-center gap-2 mb-4 text-muted">
          <span>📍 {{ announcement.address }}</span>
          <span v-if="announcement.createdAt" class="ms-auto" style="font-size:0.8rem">
            {{ new Date(announcement.createdAt.seconds * 1000).toLocaleString('pl-PL') }}
          </span>
        </div>

        <div v-if="user && user.uid !== announcement.userId">
          <router-link
            :to="`/messages?with=${announcement.userId}&announcement=${announcementId}`"
            class="btn btn-success w-100"
          >
            Skontaktuj się
          </router-link>
        </div>
        <div v-else-if="!user">
          <router-link 
            :to="{ path: '/login', query: { redirect: `/messages?with=${announcement.userId}&announcement=${announcementId}` } }" 
            class="btn btn-outline-success w-100"
          >
            Zaloguj się, aby skontaktować
          </router-link>
        </div>
        <div v-if="user && user.uid === announcement.userId" class="mt-3">
          <button class="btn btn-outline-danger w-100" @click="deleteAnnouncement">Usuń ogłoszenie</button>
        </div>
      </div>
      <div v-else class="card-body p-4 text-center text-muted">
        Ładowanie...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../composables/useAuth'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const announcementId = route.params.id
const announcement = ref(null)

onMounted(async () => {
  const snap = await getDoc(doc(db, 'announcements', announcementId))
  if (snap.exists()) announcement.value = snap.data()
})

const deleteAnnouncement = async () => {
  if (!confirm('Czy na pewno chcesz usunąć to ogłoszenie?')) return
  await deleteDoc(doc(db, 'announcements', announcementId))
  router.push('/')
}
</script>
