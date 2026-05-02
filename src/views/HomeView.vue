<template>
  <div class="position-relative w-100" style="height: calc(100vh - 56px);">
    
    <!-- kontener na opcje -->
    <div class="position-absolute top-0 start-50 translate-middle-x mt-2 mt-md-3 d-flex flex-column gap-2 bg-white p-2 p-md-3 rounded-4 shadow" style="width: 95%; max-width: 500px; z-index: 1000;">
      
      <!-- opcje -->
      <div class="d-flex gap-2 justify-content-center">
        <div class="btn-group shadow-sm w-100">
          <button
            class="btn btn-sm"
            :class="filter === 'lost' ? 'btn-danger' : 'btn-outline-danger'"
            @click="filter = 'lost'"
          >Zaginione 🔴</button>
          <button
            class="btn btn-sm"
            :class="filter === 'adoption' ? 'btn-success' : 'btn-outline-success'"
            @click="filter = 'adoption'"
          >Do adopcji 🟢</button>
        </div>
        <!-- findme -->
        <button class="btn btn-light shadow-sm px-3" @click="centerOnUser" title="Moja lokalizacja">📍</button>
        <!-- filtry -->
        <button class="btn btn-primary shadow-sm px-3" @click="showFilters = !showFilters" title="Filtry">🔍</button>
      </div>

      <!-- rozwijane filtry -->
      <div v-if="showFilters" class="mt-1">
        <div class="mb-2">
          <input 
            v-model="searchQuery" 
            type="text" 
            class="form-control form-control-sm" 
            placeholder="Szukaj (imię, rasa, opis...)"
          >
        </div>
        <div>
          <label class="form-label mb-1 text-muted small">Promień od Twojej lokalizacji:</label>
          <select v-model="radius" class="form-select form-select-sm" @change="handleRadiusChange">
            <option value="0">Bez ograniczeń</option>
            <option value="5">Do 5 km</option>
            <option value="15">Do 15 km</option>
            <option value="25">Do 25 km</option>
            <option value="50">Do 50 km</option>
            <option value="100">Do 100 km</option>
            <option value="200">Do 200 km</option>
          </select>
          <small v-if="radius > 0 && !myLocation" class="text-danger d-block mt-1">
            Kliknij 📍 aby pobrać lokalizację.
          </small>
        </div>
      </div>
    </div>
    
    <!-- Mapa Leaflet -->
    <div id="map" class="w-100 h-100"></div>

    <!-- FAB -->
    <router-link 
      v-if="user" 
      to="/create" 
      class="btn btn-success position-fixed bottom-0 end-0 m-3 m-md-4 rounded-circle shadow-lg d-flex align-items-center justify-content-center text-decoration-none"
      style="width: 65px; height: 65px; font-size: 2.5rem; line-height: 1; z-index: 1050;"
    >
      <span style="position: relative; top: -3px;">+</span>
    </router-link>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import { useAnnouncements } from '../composables/useAnnouncements'
import { useAuth } from '../composables/useAuth'

const filter = ref('lost')
const showFilters = ref(false)
const searchQuery = ref('')
const radius = ref('0')
const myLocation = ref(null)

const { announcements, unsub } = useAnnouncements()
const { user } = useAuth()
const router = useRouter()

let map = null
let markersLayer = null
let userMarker = null

onMounted(() => {
  map = L.map('map', { zoomControl: false }).setView([52.0, 19.0], 6)
  L.control.zoom({ position: 'bottomleft' }).addTo(map)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  markersLayer = L.layerGroup().addTo(map)

  map.on('popupopen', (event) => {
    const button = event.popup.getElement()?.querySelector('.add-announcement-btn')
    if (!button) return

    L.DomEvent.disableClickPropagation(button)
    L.DomEvent.on(button, 'click', (clickEvent) => {
      L.DomEvent.stop(clickEvent)
      map.closePopup()
      router.push(`/create?lat=${button.dataset.lat}&lng=${button.dataset.lng}`)
    })
  })

  map.on('click', (e) => {
    if (!user.value) return
    const { lat, lng } = e.latlng
    L.popup()
      .setLatLng(e.latlng)
      .setContent(`
        <div style="text-align:center;padding:4px 2px">
          <div style="margin-bottom:8px;font-size:0.85rem;color:#666">${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
          <button class="add-announcement-btn" data-lat="${lat}" data-lng="${lng}" style="background:#198754;color:white;padding:6px 14px;border-radius:6px;border:none;font-size:0.9rem;cursor:pointer">+ Dodaj ogłoszenie</button>
        </div>
      `)
      .openOn(map)
  })

  watch([announcements, filter, searchQuery, radius, myLocation], updateMarkers, { immediate: true })
})

onUnmounted(() => {
  unsub()
  map?.remove()
})

const updateMarkers = () => {
  if (!markersLayer || !map) return
  markersLayer.clearLayers()

  const query = searchQuery.value.toLowerCase().trim()
  const radiusValue = parseInt(radius.value)

  const filtered = announcements.value.filter(a => {
    if (a.type !== filter.value || a.isResolved) return false

    if (query) {
      const name = (a.petName || '').toLowerCase()
      const type = (a.petType || '').toLowerCase()
      const breed = (a.breed || '').toLowerCase()
      const desc = (a.description || '').toLowerCase()
      
      if (!name.includes(query) && !type.includes(query) && !breed.includes(query) && !desc.includes(query)) {
        return false
      }
    }

    if (radiusValue > 0 && myLocation.value && a.location) {
      const distInMeters = map.distance(
        [myLocation.value.lat, myLocation.value.lng],
        [a.location.latitude, a.location.longitude]
      )
      if (distInMeters > radiusValue * 1000) {
        return false
      }
    }

    return true
  })

  filtered.forEach(a => {
    if (!a.location) return
    const { latitude, longitude } = a.location
    const color = filter.value === 'lost' ? '#dc3545' : '#198754'
    const photo = a.imageUrls?.[0]

    const iconHtml = photo
      ? `<div style="width:48px;height:48px;border-radius:50%;border:3px solid ${color};overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
           <img src="${photo}" style="width:100%;height:100%;object-fit:cover;" />
         </div>`
      : `<div style="width:48px;height:48px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`

    const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [48, 48], iconAnchor: [24, 24] })

    const marker = L.marker([latitude, longitude], { icon })

    marker.on('click', () => {
      navigator.vibrate?.(50)
      router.push(`/announcement/${a.id}`)
    })

    markersLayer.addLayer(marker)
  })
}

const centerOnUser = () => {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      myLocation.value = { lat: coords.latitude, lng: coords.longitude }
      map.setView([coords.latitude, coords.longitude], 13)
      
      if (userMarker) userMarker.remove()
      const icon = L.divIcon({
        html: `<div style="width:20px;height:20px;border-radius:50%;background:#0d6efd;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
      userMarker = L.marker([coords.latitude, coords.longitude], { icon }).addTo(map)
    },
    () => alert('Nie można uzyskać lokalizacji.')
  )
}

const handleRadiusChange = () => {
  if (parseInt(radius.value) > 0 && !myLocation.value) {
    centerOnUser()
  }
}
</script>