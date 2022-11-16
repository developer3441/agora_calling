import React from 'react'
import Call from './call'
import { Routes, Route } from 'react-router-dom'
import Contacts from './contacts'
import Auth from './auth'
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase'

function App() {


  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return <div>Loading...</div>
  }
  if (error) {
    return <div>Error</div>
  }

  if (user) {
    return (
      <Call />
    )
  }
  if (!user) {
    return (
      <Auth />
    )
  }


}

export default App
