import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSignOut, useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase'
import { collection, doc, setDoc, getDocs, onSnapshot } from "firebase/firestore";
import { firestore } from './firebase'

import { GlobalProvider, useClient, useStart, useUsers } from './GlobalContext';




// Make sure to bind modal to your appElement (https://reactcommunity.org/react-modal/accessibility/)
// Modal.setAppElement('#yourAppElement');


export default function Contacts(route) {

    const [signOut, loading, error] = useSignOut(auth);






    const renderContact = (contact, index) => {
        return <div key={index} style={{ padding: 10, margin: 2, flexDirection: 'row', display: 'flex', justifyContent: 'space-between' }}>
            <div>
                {contact.id}
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', marginLeft: 10 }}>


                <button onClick={() => route.dialCall(contact, 'audio')}>Audio</button>
                <button onClick={() => route.dialCall(contact, 'video')} style={{ marginLeft: 10 }}>Video</button>
            </div>
        </div>
    }



    return (
        <div className='contacts_container'>

            {
                route.contacts.map((contact, index) => renderContact(contact, index))
            }


            {/* <button onClick={() => makeCall()} >CALL</button> */}
            <button onClick={() => signOut()} >Sign Out</button>
        </div>
    )
}
