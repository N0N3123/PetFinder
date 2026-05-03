<template>
  <div class="container form-page mx-auto" style="max-width: 800px;">
    
    <!-- lightbox na cale okno -->
    <div 
      v-if="fullscreenImage" 
      class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
      style="background: rgba(0,0,0,0.85); z-index: 9999; cursor: pointer;"
      @click="fullscreenImage = null"
    >
      <img :src="fullscreenImage" style="max-width: 95vw; max-height: 95vh; object-fit: contain;">
    </div>

    <!-- Lista chatow -->
    <div v-if="!activeChatId">
      <h4 class="mb-3 text-center">Wiadomości</h4>
      
      <!-- Wyszukiwarka czatów -->
      <div v-if="conversations.length > 0" class="mb-4">
        <input v-model="searchChat" type="text" class="form-control shadow-sm" placeholder="Szukaj (imię zwierzaka lub ostatnia wiadomość)...">
      </div>

      <div v-if="conversations.length === 0" class="text-muted text-center mt-5">
        Brak wiadomości.<br>Napisz do kogoś z widoku ogłoszenia.
      </div>
      
      <div v-else-if="filteredConversations.length === 0" class="text-muted text-center mt-4">
        Brak wyników wyszukiwania.
      </div>

      <!-- Lista z miniaturkami -->
      <div
        v-for="chat in filteredConversations"
        :key="chat.id"
        class="card mb-2 shadow-sm border-0"
        style="cursor:pointer; transition: 0.2s;"
        @click="openChat(chat.id)"
      >
        <div class="card-body py-2 px-3 d-flex align-items-center gap-3">
          
          <!-- Miniaturka zdjęcia zwierzaka (z fullsize lightbox) -->
          <div 
            class="rounded-circle bg-light border d-flex align-items-center justify-content-center shadow-sm" 
            style="width: 50px; height: 50px; flex-shrink: 0; overflow: hidden; cursor: zoom-in;"
            @click.stop="chat.petPhoto ? fullscreenImage = chat.petPhoto : null"
          >
            <img v-if="chat.petPhoto" :src="chat.petPhoto" style="width: 100%; height: 100%; object-fit: cover;">
            <span v-else style="font-size: 1.5rem;">🐾</span>
          </div>

          <!-- Tekst wiadomości -->
          <div class="overflow-hidden w-100">
            <div class="fw-bold text-truncate">{{ chat.petName }}</div>
            <div class="text-muted small text-truncate" :class="{'fw-bold text-success': chat.lastMessage === '📷 Wysłano zdjęcie'}">
              {{ chat.lastMessage || 'Brak wiadomości' }}
            </div>
          </div>
          
        </div>
      </div>
    </div>

    <!-- Aktywny czat -->
    <div v-else class="card shadow mx-auto p-2 p-md-3 d-flex flex-column border-0" style="max-width: 700px;">
      
      <!-- nagłówek z danymi rozmówcy -->
      <div class="d-flex flex-column mb-3 pb-3 border-bottom">
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary" @click="closeChat">← Wróć</button>
          <span class="fw-bold ms-2 fs-5">{{ activePetName }}</span>
        </div>

        <!-- profil użytkownika -->
        <div v-if="otherUser" class="mt-3 d-flex align-items-center bg-white p-2 rounded-3 border shadow-sm">
          <!-- Zdjecie uzytkownika (teraz klikalne!) -->
          <img 
            :src="otherUser.photoURL || 'https://ui-avatars.com/api/?name=' + (otherUser.displayName || 'Użytkownik') + '&background=198754&color=fff'" 
            class="rounded-circle me-3 border" 
            style="width: 50px; height: 50px; object-fit: cover; cursor: zoom-in;"
            @click="fullscreenImage = otherUser.photoURL || ('https://ui-avatars.com/api/?name=' + (otherUser.displayName || 'Użytkownik') + '&background=198754&color=fff')"
          >
          <div>
            <div class="fw-bold" style="font-size: 0.95rem;">{{ otherUser.displayName || 'Użytkownik' }}</div>
            <a v-if="otherUser.phone" :href="'tel:' + otherUser.phone" class="text-decoration-none text-success small d-block mt-1 fw-bold">
              📞 {{ otherUser.phone }}
            </a>
            <span v-else class="text-muted small d-block mt-1">Brak numeru telefonu</span>
          </div>
        </div>
      </div>

      <!-- Kontener wiadomości -->
      <div class="flex-grow-1 overflow-auto rounded p-2 mb-3 bg-light d-flex flex-column" ref="messagesContainer" style="height: 55vh; min-height: 300px;">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="mb-2 d-flex"
          :class="msg.senderId === user.uid ? 'justify-content-end' : 'justify-content-start'"
        >
          <div
            class="px-3 py-2 rounded-4 shadow-sm"
            style="max-width:75%"
            :class="msg.senderId === user.uid ? 'bg-success text-white' : 'bg-white border'"
          >
            <!-- jeśli wiadomość jest zdjęciem -->
            <div v-if="msg.imageUrl" class="mb-1" @click="fullscreenImage = msg.imageUrl" style="cursor: zoom-in;">
              <img :src="msg.imageUrl" class="img-fluid rounded" style="max-height: 250px; object-fit: cover;">
            </div>
            <!-- jeśli wiadomość ma tekst -->
            <div v-if="msg.text" :class="{'mt-2': msg.imageUrl}">{{ msg.text }}</div>
          </div>
        </div>
      </div>

      <!-- Pasek wysyłania -->
      <div class="d-flex gap-2 align-items-center">
        
        <!-- przycisk: galeria / plik -->
        <label for="chatImageGallery" class="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0 shadow-sm" style="width: 42px; height: 42px; cursor: pointer; flex-shrink: 0;" :title="isMobile ? 'Wybierz z galerii' : 'Wybierz plik'">
          <span v-if="uploadingImage" class="spinner-border spinner-border-sm text-secondary"></span>
          <span v-else style="position: relative;">🖼️</span>
        </label>
        <input type="file" id="chatImageGallery" class="d-none" accept="image/*" @change="sendImage" :disabled="uploadingImage">

        <!-- przycisk: aparat tylko mobile -->
        <label v-if="isMobile" for="chatImageCamera" class="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0 shadow-sm" style="width: 42px; height: 42px; cursor: pointer; flex-shrink: 0;" title="Zrób zdjęcie">
          <span v-if="uploadingImage" class="spinner-border spinner-border-sm text-secondary"></span>
          <span v-else style="position: relative; top: -2px;">📷</span>
        </label>
        <input v-if="isMobile" type="file" id="chatImageCamera" class="d-none" accept="image/*" capture="environment" @change="sendImage" :disabled="uploadingImage">

        <input
          v-model="newMessage"
          class="form-control rounded-pill px-3"
          placeholder="Wpisz wiadomość..."
          @keyup.enter="sendMessage"
        >
        <button class="btn btn-success rounded-pill px-4" @click="sendMessage">Wyślij</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { db, storage } from '../firebase/config'
import { useAuth } from '../composables/useAuth'
import {
  collection, doc, getDoc, setDoc, addDoc, updateDoc,
  query, where, orderBy, onSnapshot, serverTimestamp
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

const route = useRoute()
const { user } = useAuth()

const conversations = ref([])
const messages = ref([])
const activeChatId = ref(null)
const activePetName = ref('')
const newMessage = ref('')
const messagesContainer = ref(null)
const searchChat = ref('')
const otherUser = ref(null)

const uploadingImage = ref(false)
const fullscreenImage = ref(null) // link do fullsize zdj

let unsubConversations = null
let unsubMessages = null

// filtrowanie konwersacji
const filteredConversations = computed(() => {
  if (!searchChat.value) return conversations.value
  const q = searchChat.value.toLowerCase()
  return conversations.value.filter(c => 
    c.petName?.toLowerCase().includes(q) || 
    c.lastMessage?.toLowerCase().includes(q)
  )
})

function getChatId(announcementId, uid1, uid2) {
  return announcementId + '_' + [uid1, uid2].sort().join('_')
}

function loadConversations() {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', user.value.uid),
    orderBy('lastMessageAt', 'desc')
  )
  unsubConversations = onSnapshot(q, snap => {
    conversations.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
}

async function openChat(chatId, announcementId = null, otherUid = null) {
  if (unsubMessages) unsubMessages()
  otherUser.value = null

  const chatRef = doc(db, 'chats', chatId)
  const chatSnap = await getDoc(chatRef)
  
  let actualOtherUid = otherUid;

  if (!chatSnap.exists()) {
    let petName = 'Ogłoszenie'
    let petPhoto = ''
    
    if (announcementId) {
      const annSnap = await getDoc(doc(db, 'announcements', announcementId))
      if (annSnap.exists()) {
        petName = annSnap.data().petName
        petPhoto = annSnap.data().imageUrls?.[0] || '' 
      }
    }
    
    await setDoc(chatRef, {
      announcementId,
      petName,
      petPhoto,
      participants: [user.value.uid, actualOtherUid].sort(),
      lastMessage: '',
      lastMessageAt: serverTimestamp()
    })
    activePetName.value = petName
  } else {
    activePetName.value = chatSnap.data().petName
    const participants = chatSnap.data().participants || []
    actualOtherUid = participants.find(uid => uid !== user.value.uid)
  }

  if (actualOtherUid) {
    const userSnap = await getDoc(doc(db, 'users', actualOtherUid))
    if (userSnap.exists()) {
      otherUser.value = userSnap.data()
    }
  }

  activeChatId.value = chatId

  const q = query(
    collection(db, 'messages'),
    where('chatId', '==', chatId),
    orderBy('createdAt', 'asc')
  )
  unsubMessages = onSnapshot(q, snap => {
    messages.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  })
}

function closeChat() {
  if (unsubMessages) unsubMessages()
  activeChatId.value = null
  messages.value = []
  otherUser.value = null
}

async function sendMessage() {
  const text = newMessage.value.trim()
  if (!text) return
  newMessage.value = ''

  await addDoc(collection(db, 'messages'), {
    chatId: activeChatId.value,
    senderId: user.value.uid,
    text,
    imageUrl: null,
    createdAt: serverTimestamp()
  })

  await updateDoc(doc(db, 'chats', activeChatId.value), {
    lastMessage: text,
    lastMessageAt: serverTimestamp()
  })
}

// funkcja wysylajaca zdjecie
async function sendImage(event) {
  const file = event.target.files[0]
  if (!file) return

  uploadingImage.value = true

  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `chat_images/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const imgRef = storageRef(storage, fileName)
    
    await uploadBytes(imgRef, file)
    const imageUrl = await getDownloadURL(imgRef)

    // dodaje wiadomosc ze zdjeciem (bez tekstu)
    await addDoc(collection(db, 'messages'), {
      chatId: activeChatId.value,
      senderId: user.value.uid,
      text: '',
      imageUrl: imageUrl,
      createdAt: serverTimestamp()
    })

    // ustawia info o zdjeciu na liscie czatow
    await updateDoc(doc(db, 'chats', activeChatId.value), {
      lastMessage: '📷 Wysłano zdjęcie',
      lastMessageAt: serverTimestamp()
    })
  } catch (err) {
    console.error("blad wysylania:", err)
    alert("Cos poszlo nie tak z wysylaniem fotki.")
  } finally {
    uploadingImage.value = false
    event.target.value = '' // czysci inputa
  }
}

onMounted(() => {
  loadConversations()

  const withUid = route.query.with
  const announcementId = route.query.announcement
  if (withUid && announcementId) {
    const chatId = getChatId(announcementId, user.value.uid, withUid)
    openChat(chatId, announcementId, withUid)
  }
})

onUnmounted(() => {
  if (unsubConversations) unsubConversations()
  if (unsubMessages) unsubMessages()
})
</script>