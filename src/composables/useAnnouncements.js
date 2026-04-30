import { ref } from 'vue'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'

export function useAnnouncements() {
  const announcements = ref([])
  const error = ref(null)

  const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'))

  const unsub = onSnapshot(q, (snapshot) => {
    announcements.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }, (e) => {
    error.value = e.message
  })

  return { announcements, error, unsub }
}
