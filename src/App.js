import React from 'react'
import Call from './call'
import { Routes, Route } from 'react-router-dom'
import Contacts from './contacts'
import Auth from './auth'
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase'
import CallScreen from './callScreen'

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
      // <Call />c
      // <CallScreen />
      <div>
        <Routes>
          <Route exact path="/" element={<CallScreen />} />


          {/* <Route path="/callScreen" element={<CallScreen />} /> */}

        </Routes>
      </div>
    )
  }
  if (!user) {
    return (
      <Auth />
    )
  }


}

export default App
