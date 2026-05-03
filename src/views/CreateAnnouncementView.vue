<template>
  <div class="container mt-5 pt-4 form-page">
    <div class="card shadow mx-auto" style="max-width: 600px;">
      <div class="card-body p-4">
        <h3 class="text-center mb-4">Dodaj ogłoszenie</h3>
        
        <form @submit.prevent="handleSubmit">
          <div class="mb-3">
            <label class="form-label d-block">Typ ogłoszenia</label>
            <div class="btn-group w-100" role="group">
              <input type="radio" class="btn-check" id="lost" value="lost" v-model="form.type">
              <label class="btn btn-outline-danger" for="lost">Zaginione 🔴</label>

              <input type="radio" class="btn-check" id="adoption" value="adoption" v-model="form.type">
              <label class="btn btn-outline-success" for="adoption">Do adopcji 🟢</label>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">Imię zwierzaka</label>
            <input type="text" class="form-control" v-model="form.petName" required>
          </div>

          <div class="row">
            <div class="col-6 mb-3">
              <label class="form-label">Gatunek</label>
              <input type="text" class="form-control" v-model="form.petType" required>
            </div>
            <div class="col-6 mb-3">
              <label class="form-label">Rasa</label>
              <input type="text" class="form-control" v-model="form.breed">
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">Zdjęcie zwierzaka</label>
            <input type="file" class="form-control" accept="image/*" @change="handleFile" required>
          </div>

          <div class="mb-3">
            <label class="form-label">Opis (opcjonalnie)</label>
            <textarea class="form-control" v-model="form.description" rows="3"></textarea>
          </div>

          <div class="mb-4">
            <label class="form-label">Lokalizacja</label>
            <div class="input-group">
              <input type="text" class="form-control" v-model="form.address" placeholder="Adres / Miasto" required>
              <button type="button" class="btn btn-secondary" @click="getLocation" :disabled="gettingLocation">
                {{ gettingLocation ? 'Szukam...' : '📍 Użyj GPS' }}
              </button>
            </div>
            <small class="text-muted" v-if="form.location">
              Współrzędne pobrane: {{ form.location.latitude.toFixed(4) }}, {{ form.location.longitude.toFixed(4) }}
            </small>
          </div>

          <div v-if="error" class="alert alert-danger">{{ error }}</div>

          <div class="d-flex gap-2 mt-4">
            <button type="button" class="btn btn-outline-secondary w-50" @click="router.push('/')">
              Anuluj
            </button>
            <button type="submit" class="btn btn-success w-50" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ loading ? 'Wysyłanie...' : 'Opublikuj' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const route = useRoute()
const { user } = useAuth()

const loading = ref(false)
const error = ref(null)
const gettingLocation = ref(false)
const imageFile = ref(null)

const form = reactive({
  type: 'lost',
  petName: '',
  petType: '',
  breed: '',
  description: '',
  address: '',
  location: null
})

onMounted(async () => {
  const lat = parseFloat(route.query.lat)
  const lng = parseFloat(route.query.lng)
  if (!isNaN(lat) && !isNaN(lng)) {
    form.location = { latitude: lat, longitude: lng }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'Accept-Language': 'pl' } })
      const data = await res.json()
      const a = data.address
      form.address = a.city || a.town || a.village || a.county || ''
      if (a.road) form.address = a.road + ', ' + form.address
    } catch {
      form.address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
  }
})

const handleFile = (event) => {
  imageFile.value = event.target.files[0]
}

const getLocation = () => {
  if (!navigator.geolocation) {
    error.value = 'Twoja przeglądarka nie obsługuje geolokalizacji.'
    return
  }
  
  gettingLocation.value = true
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      form.location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json&accept-language=pl`,
          { headers: { 'Accept-Language': 'pl' } }
        )
        const data = await res.json()
        const a = data.address
        form.address = a.city || a.town || a.village || a.county || ''
        if (a.road) form.address = a.road + ', ' + form.address
      } catch {
        form.address = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
      }
      gettingLocation.value = false
    },
    () => {
      error.value = 'Nie udało się pobrać lokalizacji GPS. Wpisz adres ręcznie.'
      gettingLocation.value = false
    }
  )
}

const handleSubmit = async () => {
  if (!imageFile.value) {
    error.value = 'Proszę dodać zdjęcie.'
    return
  }
  if (!form.location) {
    error.value = 'Proszę podać lokalizację (kliknij Użyj GPS).'
    return
  }

  loading.value = true
  error.value = null

  try {
    const fileExtension = imageFile.value.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`
    const imgRef = storageRef(storage, `pets/${fileName}`)
    
    await uploadBytes(imgRef, imageFile.value)
    const imageUrl = await getDownloadURL(imgRef)

    await addDoc(collection(db, 'announcements'), {
      type: form.type,
      petName: form.petName,
      petType: form.petType,
      breed: form.breed,
      description: form.description,
      address: form.address,
      location: form.location,
      imageUrls: [imageUrl],
      userId: user.value.uid,
      createdAt: serverTimestamp(),
      isResolved: false
    })

    // Wibracja telefonu po sukcesie
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }

    // Przekierowanie na mapę główną
    router.push('/')
  } catch (err) {
    error.value = 'Wystąpił błąd podczas dodawania ogłoszenia: ' + err.message
  } finally {
    loading.value = false
  }
}
</script>