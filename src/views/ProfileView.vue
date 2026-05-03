<template>
  <div class="container mt-5 pt-4 form-page">
    
    <!-- lightbox na cale okno -->
    <div 
      v-if="fullscreenImage" 
      class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
      style="background: rgba(0,0,0,0.85); z-index: 9999; cursor: pointer;"
      @click="fullscreenImage = null"
    >
      <img :src="fullscreenImage" style="max-width: 95vw; max-height: 95vh; object-fit: contain;">
    </div>

    <div class="card shadow mx-auto" style="max-width: 500px;">
      <div class="card-body p-4 p-md-5">
        <h3 class="text-center mb-4">Twój Profil</h3>
        
        <div class="text-center mb-4">
          <div class="position-relative d-inline-block">
            <!-- Awatar -->
            <img 
              :src="profileData.photoURL || 'https://ui-avatars.com/api/?name=' + (user?.displayName || 'User') + '&background=198754&color=fff'" 
              alt="Profilowe" 
              class="rounded-circle border border-3 border-success shadow-sm"
              style="width: 120px; height: 120px; object-fit: cover; cursor: zoom-in;"
              @click="fullscreenImage = profileData.photoURL || 'https://ui-avatars.com/api/?name=' + (user?.displayName || 'User') + '&background=198754&color=fff'"
            />
            
            <!-- Przycisk: Galeria / Plik (na pc po prawej, na mobile po lewej) -->
            <label for="photoGallery" class="position-absolute bottom-0 bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center shadow"
                   :class="isMobile ? 'start-0' : 'end-0'"
                   :style="{ width: '38px', height: '38px', cursor: 'pointer', transform: isMobile ? 'translate(-10%, 10%)' : 'translate(10%, 10%)' }"
                   :title="isMobile ? 'Wybierz z galerii' : 'Zmień zdjęcie'">
              <span style="position: relative; top: 1px;">🖼️</span>
            </label>
            <input type="file" id="photoGallery" class="d-none" accept="image/*" @change="handlePhotoUpload">

            <!-- Przycisk: Aparat (tylko na mobile) -->
            <label v-if="isMobile" for="photoCamera" class="position-absolute bottom-0 end-0 bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center shadow"
                   style="width: 38px; height: 38px; cursor: pointer; transform: translate(10%, 10%);" title="Zrób zdjęcie">
              <span style="position: relative; top: -2px;">📷</span>
            </label>
            <input v-if="isMobile" type="file" id="photoCamera" class="d-none" accept="image/*" capture="environment" @change="handlePhotoUpload">
          </div>
        </div>

        <form @submit.prevent="saveProfile">
          <div class="mb-3">
            <label class="form-label text-muted small mb-0">Email</label>
            <input type="email" class="form-control bg-light" :value="user?.email" disabled>
          </div>
          
          <div class="mb-3">
            <label class="form-label text-muted small mb-0">Imię / Nick</label>
            <input type="text" class="form-control" v-model="profileData.displayName" required>
          </div>

          <div class="mb-4">
            <label class="form-label text-muted small mb-0">Numer telefonu (opcjonalnie)</label>
            <input type="tel" class="form-control" v-model="profileData.phone" placeholder="+48 123 456 789">
            <small class="text-muted">Pomaga w szybszym kontakcie przy adopcji/zgubie.</small>
          </div>

          <div v-if="message" class="alert alert-success py-2">{{ message }}</div>
          <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>

          <div class="d-flex gap-2 mb-4">
            <button type="submit" class="btn btn-success w-100" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ loading ? 'Zapisywanie...' : 'Zapisz zmiany' }}
            </button>
          </div>
        </form>

        <hr>
        <button @click="handleLogout" class="btn btn-outline-danger w-100">
          Wyloguj się
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { updateProfile } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'
import { useAuth } from '../composables/useAuth'

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

const router = useRouter()
const { user, logout } = useAuth()

const loading = ref(false)
const message = ref('')
const error = ref('')
const fullscreenImage = ref(null) // trzyma link do powiekszonego zdjecia

// Lokalne dane formularza
const profileData = reactive({
  displayName: '',
  phone: '',
  photoURL: ''
})

// Pobranie z Firestore przy wejściu
onMounted(async () => {
  if (user.value) {
    profileData.displayName = user.value.displayName || ''
    profileData.photoURL = user.value.photoURL || ''
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.value.uid))
      if (userDoc.exists()) {
        profileData.phone = userDoc.data().phone || ''
      }
    } catch (e) {
      console.error("Błąd pobierania danych usera:", e)
    }
  }
})

const handlePhotoUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  loading.value = true
  error.value = ''
  message.value = ''

  try {
    const fileExt = file.name.split('.').pop()
    const imgRef = storageRef(storage, `avatars/${user.value.uid}_${Date.now()}.${fileExt}`)
    
    await uploadBytes(imgRef, file)
    const url = await getDownloadURL(imgRef)
    
    await updateProfile(user.value, { photoURL: url })
    await updateDoc(doc(db, 'users', user.value.uid), { photoURL: url })
    
    profileData.photoURL = url
    message.value = 'Zdjęcie zaktualizowane!'
  } catch (err) {
    error.value = 'Błąd wgrywania zdjęcia: ' + err.message
  } finally {
    loading.value = false
    event.target.value = '' // resetujemy inputa
  }
}

// zapisywanie tekstu
const saveProfile = async () => {
  loading.value = true
  error.value = ''
  message.value = ''

  try {
    if (profileData.displayName !== user.value.displayName) {
      await updateProfile(user.value, { displayName: profileData.displayName })
    }
    await updateDoc(doc(db, 'users', user.value.uid), {
      displayName: profileData.displayName,
      phone: profileData.phone
    })

    message.value = 'Profil został pomyślnie zaktualizowany!'
    setTimeout(() => { message.value = '' }, 3000)
  } catch (err) {
    error.value = 'Nie udało się zapisać zmian: ' + err.message
  } finally {
    loading.value = false
  }
}

const handleLogout = async () => {
  await logout()
  router.push('/login')
}
</script>