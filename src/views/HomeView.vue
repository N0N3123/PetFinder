<template>
  <div class="map-wrapper">
    <div class="map-controls">
      <div class="btn-group">
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
      <button class="btn btn-sm btn-light ms-2" @click="centerOnUser" title="Moja lokalizacja">📍</button>
    </div>
    <div id="map"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import { useAnnouncements } from '../composables/useAnnouncements'

const filter = ref('lost')
const { announcements, unsub } = useAnnouncements()

let map = null
let markersLayer = null

onMounted(() => {
  map = L.map('map').setView([52.0, 19.0], 6)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  markersLayer = L.layerGroup().addTo(map)

  watch([announcements, filter], updateMarkers, { immediate: true })
})

onUnmounted(() => {
  unsub()
  map?.remove()
})

const updateMarkers = () => {
  markersLayer.clearLayers()

  const filtered = announcements.value.filter(
    a => a.type === filter.value && !a.isResolved
  )

  filtered.forEach(a => {
    if (!a.location) return
    const { latitude, longitude } = a.location
    const color = filter.value === 'lost' ? '#dc3545' : '#198754'
    const photo = a.imageUrls?.[0]

    const iconHtml = photo
      ? `<div style="width:48px;height:48px;border-radius:50%;border:3px solid ${color};overflow:hidden;">
           <img src="${photo}" style="width:100%;height:100%;object-fit:cover;" />
         </div>`
      : `<div style="width:48px;height:48px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`

    const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [48, 48], iconAnchor: [24, 24] })

    const marker = L.marker([latitude, longitude], { icon })

    marker.on('click', () => {
      navigator.vibrate?.(50)
      marker.bindPopup(`
        <strong>${a.petName}</strong><br>
        ${a.petType}${a.breed ? ' · ' + a.breed : ''}<br>
        <small>${a.address || ''}</small>
      `).openPopup()
    })

    markersLayer.addLayer(marker)
  })
}

const centerOnUser = () => {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => map.setView([coords.latitude, coords.longitude], 13),
    () => alert('Nie można uzyskać lokalizacji.')
  )
}
</script>
