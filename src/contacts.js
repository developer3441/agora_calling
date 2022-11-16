import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSignOut, useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase'
import { collection, doc, setDoc, getDocs, onSnapshot } from "firebase/firestore";
import { firestore } from './firebase'
import Modal from 'react-modal';
import { GlobalProvider, useClient, useStart, useUsers } from './GlobalContext';


const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'tomato'
    },
};

// Make sure to bind modal to your appElement (https://reactcommunity.org/react-modal/accessibility/)
// Modal.setAppElement('#yourAppElement');


export default function Contacts(route) {
    const navigate = useNavigate()
    const [signOut, loading, error] = useSignOut(auth);
    const [contacts, setContacts] = useState([])
    const [incoming, setIncoming] = useState(false);
    const [user] = useAuthState(auth);
    const [channel, setChannel] = useState(null)
    const [callToken, setCallToken] = useState(null)
    const [caller, setCaller] = useState(null)





    const dialCall = async (item, type) => {

        try {
            const docData = {
                callee: item?.id,
                caller: user?.email,
                type: type,
                calling: true,
                channelName: 'second',
                token: '007eJxTYNiyq2LeyolMd+ptOEy+Gr3defGlS5jNtIcR8/8q/95iaPFXgcEw0SQp2SLJyMjE3NIkLTnN0twsxSzFxNQsxTgpNTE55cLEkuSGQEaGzVmlrIwMEAjiszEUpybn56UwMAAAUgcjJg=='
            }
            await setDoc(doc(firestore, "calling", user?.email), docData);
            await setDoc(doc(firestore, "calling", item?.id), docData);
        } catch (error) {
            console.log(error)
        }
    }



    const makeCall = (channelName, token, uid) => {
        return route.initFunc(channelName, token, uid)

    }


    const getContacts = async () => {
        try {
            let tempArr = []
            const querySnapshot = await getDocs(collection(firestore, "calling"))
            querySnapshot.forEach((doc) => {
                tempArr.push({ ...doc.data(), id: doc.id })
            });
            setContacts(tempArr)
        } catch (error) {
            console.log('-------------------->', error)
        }
    }


    const acceptCall = async () => {
        setIncoming(false)
        makeCall(channel, callToken, user?.email)
    }

    const declineCall = async () => {
        setIncoming(false)
        const docData = {
            callee: null,
            caller: null,
            type: null,
            calling: false,
            channelName: null,
            token: null
        }
        await setDoc(doc(firestore, "calling", user?.email), docData);
        await setDoc(doc(firestore, "calling", caller), docData);
    }

    useEffect(() => {
        getContacts()
        const unsub = onSnapshot(doc(firestore, "calling", user?.email), (doc) => {
            let data = { id: doc?.id, ...doc.data() }
            console.log("Current data: ", data);
            if (data?.calling === true) {
                if (data.caller === user?.email) {

                    makeCall(data?.channelName, data?.token, user?.email)
                    setCaller(data?.caller)
                    // console.log('--------->making call')
                } else if (data.callee === user?.email) {
                    setIncoming(true)
                    setChannel(data?.channelName)
                    setCallToken(data?.token)
                    setCaller(data?.caller)

                }
            } else if (data?.calling === false) {

                console.log('in callered')

                setIncoming(false)
                setChannel(null)
                setCallToken(null)
                setCaller(null)

                // if (user?.email === caller) {
                //     console.log('--->>>>>>caller')
                //     setCaller(null)
                //     route.leaveChannel()
                // } else {
                //     console.log('------->>>>>>>>calleee')
                //     setIncoming(false)
                //     setChannel(null)
                //     setCallToken(null)
                //     setCaller(null)
                // }
            }

        });
        // return unsub;

    }, [user])




    const renderContact = (contact, index) => {
        return <div key={index} style={{ padding: 10, margin: 2, flexDirection: 'row', display: 'flex', justifyContent: 'space-between' }}>
            <div>
                {contact.id}
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', marginLeft: 10 }}>
                <button onClick={() => dialCall(contact, 'audio')}>Audio</button>
                <button onClick={() => dialCall(contact, 'video')} style={{ marginLeft: 10 }}>Video</button>
            </div>
        </div>
    }



    return (
        <div className='contacts_container'>

            {
                contacts.map((contact, index) => renderContact(contact, index))
            }


            {/* <button onClick={() => makeCall()} >CALL</button> */}
            <button onClick={() => signOut()} >Sign Out</button>



            <Modal
                isOpen={incoming}
                // onAfterOpen={afterOpenModal}
                // onRequestClose={closeModal}
                style={customStyles}

            >
                <h2>Hello</h2>
                <button onClick={() => acceptCall()}>Accept</button>
                <button onClick={() => declineCall()}>Decline</button>

            </Modal>

        </div>
    )
}
