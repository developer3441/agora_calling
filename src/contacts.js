import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSignOut, useAuthState } from 'react-firebase-hooks/auth';

import { collection, doc, setDoc, getDoc, getDocs, onSnapshot, query } from "firebase/firestore";

import { firestore, auth } from './firebase'
import { getToken, createMeeting } from "./api";


import { GlobalProvider, useClient, useStart, useUsers } from './GlobalContext';

import Modal from 'react-modal';
import axios from 'axios'


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


export default function Contacts(props) {


    const navigate = useNavigate();
    const [signOut, loading, error] = useSignOut(auth);
    const [contacts, setContacts] = useState([])

    const [incoming, setIncoming] = useState(false);
    const [user] = useAuthState(auth);

    const [caller, setCaller] = useState(null)
    const [callee, setCallee] = useState(null)
    const [outgoing, setOutgoing] = useState(false)
    const [type, setType] = useState('audio')
    const timeOut = useRef(null)





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

    const checkAvailable = async (id) => {
        const result = await getDoc(doc(firestore, "calling", id));

        console.log(result.data())
        if (result?.data().calling === true) {
            console.log('Busy')
            return false;

        } else {
            console.log('Available')
            return true;
        }
    }

    const dialCall = async (item, type) => {


        const online = await checkAvailable(item?.id)

        if (!online) {

            alert('Already in call')
            return;
        }








        try {




            // let calleeResponse = await axios(calleeConfig)
            // calleeResponse = calleeResponse?.data
            // console.log(calleeResponse);

            const token = await getToken()
            let meetingId = await createMeeting({ token })



            const callData = {
                callee: item?.id,
                caller: user?.email,
                type: type,
                calling: true,
                token: token,
                meetingId: meetingId,
                accepted: false

            }


            await setDoc(doc(firestore, "calling", user?.email), callData);
            await setDoc(doc(firestore, "calling", item?.id), callData);

            timeOut.current = setTimeout(async () => {



                const result = await getDoc(doc(firestore, "calling", user?.email));


                if (result.data()?.accepted === false) {
                    expireCall(user?.email, item?.id)
                }

            }, 60000);


        } catch (error) {
            console.log(error)
        }
    }

    const expireCall = async (callerData, calleeData) => {
        console.log('---------expire call', callerData, calleeData)

        try {
            const docData = {
                callee: null,
                caller: null,
                type: null,
                calling: false,
                // channelName: null,
                token: null,
                meetingId: null,
                accepted: false
            }

            try {
                await setDoc(doc(firestore, "calling", callerData), docData);
            } catch (error) {
                console.log(error)
            }
            try {
                await setDoc(doc(firestore, "calling", calleeData), docData);
            } catch (error) {
                console.log(error)
            }


        } catch (error) {
            console.log(error)
        }
    }



    const acceptCall = async () => {
        setIncoming(false)

        console.log('this is caller', caller)
        console.log('this is callee', callee)
        const callerData = {
            // callee: callee,
            // caller: user?.email,
            // type: type,
            // calling: true,
            // channelName: callerResponse?.channelName,
            // token: callerResponse?.token,
            accepted: true

        }
        const calleeData = {
            // callee: callee,
            // caller: user?.email,
            // type: type,
            // calling: true,
            // channelName: calleeResponse?.channelName,
            // token: calleeResponse?.token,
            accepted: true
        }

        await setDoc(doc(firestore, "calling", caller), callerData, { merge: true });
        await setDoc(doc(firestore, "calling", callee), calleeData, { merge: true });

        // init(channel, callToken, user?.email)
    }

    const endCall = async () => {

        console.log('---------endcall', caller, callee)

        try {
            const docData = {
                callee: null,
                caller: null,
                type: null,
                calling: false,
                accepted: false,
                meetingId: null,
                token: null
            }

            try {
                await setDoc(doc(firestore, "calling", caller), docData);
            } catch (error) {
                console.log(error)
            }
            try {
                await setDoc(doc(firestore, "calling", callee), docData);
            } catch (error) {
                console.log(error)
            }


        } catch (error) {
            console.log(error)
        }
    }



    useEffect(() => {
        getContacts()
        const unsub = onSnapshot(doc(firestore, "calling", user?.email), (doc) => {
            let data = { id: doc?.id, ...doc.data() }
            console.log("Current data: ", data);
            if (data?.calling === true) {
                if (data.caller === user?.email) {

                    if (data.accepted === true) {
                        clearTimeout(timeOut.current)
                        setOutgoing(false)
                        setType(data?.type)
                        props.setMeetingAndToken(data?.token, data?.meetingId, data?.type, data?.caller, data?.callee)
                        // navigate('/callScreen', { state: { meetingId: data?.meetingId, token: data?.token, user: user?.email, type: data?.type } });
                        // init(data?.channelName, data?.meetingId, user?.email, data?.type)
                    } else {
                        setOutgoing(true)
                    }

                    setCaller(data?.caller)
                    setCallee(data?.callee)


                } else if (data.callee === user?.email) {
                    if (data?.accepted === false) {
                        setIncoming(true)


                        setCaller(data?.caller)
                        setCallee(data?.callee)
                    } else if (data?.accepted === true) {
                        setType(data?.type)
                        props.setMeetingAndToken(data?.token, data?.meetingId, data?.type, data?.caller, data?.callee)
                        // navigate('/callScreen', { state: { meetingId: data?.meetingId, token: data?.token, user: data?.callee, type: data?.type } });
                    }


                }
            } else if (data?.calling === false) {


                setIncoming(false)
                setOutgoing(false)
                setCaller(null)
                setCallee(null)


                if (timeOut?.current) {
                    clearTimeout(timeOut?.current)
                }




            }

        });
        return unsub;


    }, [])





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
        <div style={{ width: '50%', alignSelf: 'center' }} className='contacts_container'>

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
                <h2>{caller}</h2>
                <button onClick={() => acceptCall()}>Accept</button>
                <button onClick={() => endCall()}>Decline</button>

            </Modal>

            <Modal
                isOpen={outgoing}
                // onAfterOpen={afterOpenModal}
                // onRequestClose={closeModal}
                style={customStyles}

            >
                <h2>{
                    // callee
                    'calling.....'
                }</h2>
                {/* <button onClick={() => acceptCall()}>Accept</button>
                <button onClick={() => endCall()}>Decline</button> */}

            </Modal>

        </div>
    )
}
