<template>
  <div class="container form-page mx-auto" style="max-width: 800px;">
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
          
          <!-- Miniaturka zdjęcia zwierzaka -->
          <div 
            class="rounded-circle bg-light border d-flex align-items-center justify-content-center shadow-sm" 
            style="width: 50px; height: 50px; flex-shrink: 0; overflow: hidden;"
          >
            <img v-if="chat.petPhoto" :src="chat.petPhoto" style="width: 100%; height: 100%; object-fit: cover;">
            <span v-else style="font-size: 1.5rem;">🐾</span>
          </div>

          <!-- Tekst wiadomości -->
          <div class="overflow-hidden w-100">
            <div class="fw-bold text-truncate">{{ chat.petName }}</div>
            <div class="text-muted small text-truncate">{{ chat.lastMessage || 'Brak wiadomości' }}</div>
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
          <img 
            :src="otherUser.photoURL || 'https://ui-avatars.com/api/?name=' + (otherUser.displayName || 'Użytkownik') + '&background=198754&color=fff'" 
            class="rounded-circle me-3 border" 
            style="width: 50px; height: 50px; object-fit: cover;"
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
            {{ msg.text }}
          </div>
        </div>
      </div>

      <div class="d-flex gap-2">
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
import { db } from '../firebase/config'
import { useAuth } from '../composables/useAuth'
import {
  collection, doc, getDoc, setDoc, addDoc, updateDoc,
  query, where, orderBy, onSnapshot, serverTimestamp
} from 'firebase/firestore'

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

let unsubConversations = null
let unsubMessages = null

// Filtrowanie konwersacji
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
    //UID 
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
    createdAt: serverTimestamp()
  })

  await updateDoc(doc(db, 'chats', activeChatId.value), {
    lastMessage: text,
    lastMessageAt: serverTimestamp()
  })
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