import { ref } from 'vue'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase/config'

const user = ref(null)

onAuthStateChanged(auth, (firebaseUser) => {
  user.value = firebaseUser
})

export function useAuth() {
  const error = ref(null)
  const loading = ref(false)

  const register = async (email, password, displayName) => {
    error.value = null
    loading.value = true
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(newUser, { displayName })
      await setDoc(doc(db, 'users', newUser.uid), {
        displayName,
        email,
        phone: '',
        photoURL: '',
        createdAt: serverTimestamp(),
        isActive: true
      })
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  const login = async (email, password) => {
    error.value = null
    loading.value = true
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  const loginWithGoogle = async () => {
    error.value = null
    loading.value = true
    try {
      const { user: googleUser } = await signInWithPopup(auth, googleProvider)
      await setDoc(doc(db, 'users', googleUser.uid), {
        displayName: googleUser.displayName,
        email: googleUser.email,
        phone: '',
        photoURL: googleUser.photoURL ?? '',
        createdAt: serverTimestamp(),
        isActive: true
      }, { merge: true })
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        error.value = e.message
      }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  return { user, error, loading, register, login, loginWithGoogle, logout }
}
