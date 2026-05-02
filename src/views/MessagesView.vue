<template>
  <div class="container form-page mx-auto" style="max-width: 800px;">

    <!-- Lista rozmów -->
    <div v-if="!activeChatId">
      <h4 class="mb-3 text-center">Wiadomości</h4>
      <div v-if="conversations.length === 0" class="text-muted text-center mt-5">
        Brak wiadomości.<br>Napisz do kogoś z widoku ogłoszenia.
      </div>
      <div
        v-for="chat in conversations"
        :key="chat.id"
        class="card mb-2 shadow-sm"
        style="cursor:pointer"
        @click="openChat(chat.id)"
      >
        <div class="card-body py-2 px-3">
          <div class="fw-bold">{{ chat.petName }}</div>
          <div class="text-muted small text-truncate">{{ chat.lastMessage || 'Brak wiadomości' }}</div>
        </div>
      </div>
    </div>

    <!-- Aktywny czat -->
    <div v-else class="card shadow mx-auto p-2 p-md-3 d-flex flex-column" style="max-width: 700px;">
      <div class="d-flex align-items-center mb-3 gap-2">
        <button class="btn btn-sm btn-outline-secondary" @click="closeChat">← Wróć</button>
        <span class="fw-bold">{{ activePetName }}</span>
      </div>

      <div class="flex-grow-1 overflow-auto border rounded p-2 mb-3 bg-light d-flex flex-column" ref="messagesContainer" style="height: 65vh; min-height: 350px;">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="mb-2 d-flex"
          :class="msg.senderId === user.uid ? 'justify-content-end' : 'justify-content-start'"
        >
          <div
            class="px-3 py-2 rounded-3 shadow-sm"
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
          class="form-control"
          placeholder="Wpisz wiadomość..."
          @keyup.enter="sendMessage"
        >
        <button class="btn btn-success" @click="sendMessage">Wyślij</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
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

let unsubConversations = null
let unsubMessages = null

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

  const chatRef = doc(db, 'chats', chatId)
  const chatSnap = await getDoc(chatRef)

  if (!chatSnap.exists()) {
    let petName = 'Ogłoszenie'
    if (announcementId) {
      const annSnap = await getDoc(doc(db, 'announcements', announcementId))
      if (annSnap.exists()) petName = annSnap.data().petName
    }
    await setDoc(chatRef, {
      announcementId,
      petName,
      participants: [user.value.uid, otherUid].sort(),
      lastMessage: '',
      lastMessageAt: serverTimestamp()
    })
    activePetName.value = petName
  } else {
    activePetName.value = chatSnap.data().petName
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
