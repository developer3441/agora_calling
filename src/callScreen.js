import React, { useEffect, useRef, useMemo, useState } from 'react'

import { Row, Col } from 'react-simple-flex-grid'
import 'react-simple-flex-grid/lib/main.css'

import { MeetingProvider, MeetingConsumer, useMeeting, useParticipant } from '@videosdk.live/react-sdk'

import { createMeeting, getToken } from './api'
import Contacts from './contacts'
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { useAuthState } from 'react-firebase-hooks/auth';

import { firestore, auth } from './firebase'


const chunk = (arr) => {
    const newArr = []
    while (arr.length) newArr.push(arr.splice(0, 3))

    return newArr
}


function JoinScreen({ updateMeetingId, setMeetingAndToken }) {
    return (
        <div>
            <input type='text' placeholder='Enter Meeting ID' onChange={(e) => updateMeetingId(e.target.value)} />
            <button onClick={setMeetingAndToken}>
                Join
            </button>
            <button onClick={setMeetingAndToken}>
                Create Meeting
            </button>
        </div>
    )

}


function ParticipantView(props) {
    const webcamRef = useRef(null)
    const micRef = useRef(null)
    const screenShareRef = useRef(null)

    const {
        displayName,
        webcamStream,
        micStream,
        screenShareStream,
        webcamOn,
        micOn,
        screenShareOn

    } = useParticipant(props.participantId)


    useEffect(() => {
        if (webcamRef.current) {
            if (webcamOn && webcamStream) {
                const mediaStream = new MediaStream()
                mediaStream.addTrack(webcamStream.track)
                webcamRef.current.srcObject = mediaStream
                webcamRef.current.play().catch(error => {
                    console.log('video play error', error)
                })
            } else {
                webcamRef.current.srcObject = null
            }
        }
    }, [webcamStream, webcamOn])


    useEffect(() => {
        if (micRef.current) {
            if (micOn && micStream) {
                const mediaStream = new MediaStream()
                mediaStream.addTrack(micStream.track)
                micRef.current.srcObject = mediaStream
                micRef.current.play().catch(error => {
                    console.log('video play error', error)
                })
            } else {
                micRef.current.srcObject = null
            }
        }
    }, [micStream, micOn])



    return (
        <div key={props.participantId}>
            <audio ref={micRef} autoPlay />
            {
                webcamRef || micOn ? (<div>
                    <h2>{displayName}</h2>
                    <video height='100%' width='100%' ref={webcamRef} autoPlay />
                </div>)
                    : null


            }


        </div>
    )
}


function MeetingGrid(props) {
    const [joined, setJoined] = useState(false)
    const [user] = useAuthState(auth);

    const { join, leave, toggleMic, toggleWebcam } = useMeeting()
    const { participants } = useMeeting()

    const joinMeeting = () => {
        console.log('joining------>')
        join()
        setJoined(true)

    }

    const endCall = async () => {

        console.log('---------endcall', props.caller, props.callee)

        try {
            const docData = {
                callee: null,
                caller: null,
                type: null,
                calling: false,
                accepted: false,
                token: null,
                meetingId: null

            }

            try {
                await setDoc(doc(firestore, "calling", props?.caller), docData);
            } catch (error) {
                console.log(error)
            }
            try {
                await setDoc(doc(firestore, "calling", props?.callee), docData);
            } catch (error) {
                console.log(error)
            }


        } catch (error) {
            console.log(error)
        }
    }

    const leaveMeeting = () => {
        leave()
        props.setMeetingAndToken(null, null, 'audio', null, null)
    }

    useEffect(() => {
        if (!joined) {
            joinMeeting()
        }

        const unsub = onSnapshot(doc(firestore, "calling", user?.email), (doc) => {
            let data = { id: doc?.id, ...doc.data() }
            console.log("Current data: ", data);
            if (data?.calling === false) {

                leaveMeeting()


            }

        });
        return unsub;

    }, [])





    return (
        <div>
            <header>Meeting ID:{props.meetingId}</header>
            {joined ? <div>
                <button onClick={endCall}>Leave</button>
                <button onClick={toggleMic}>Toggle Mic</button>
                <button onClick={toggleWebcam}>toggleWebcam</button>

            </div>
                :
                (
                    <button onClick={joinMeeting}>
                        Join
                    </button>

                )
            }
            <div>
                {
                    chunk([...participants.keys()]).map((k) => (
                        <Row key={k} gutter={80}>
                            {k.map((l) => (
                                <Col span={4}
                                >
                                    <ParticipantView key={l} participantId={l} />
                                </Col>
                            ))}
                        </Row>
                    ))
                }
            </div>
        </div>
    )


}

const CallScreen = () => {

    const [user] = useAuthState(auth);
    const [token, setToken] = useState(null)
    const [meetingId, setMeetingId] = useState(null)
    const [caller, setCaller] = useState(null)
    const [callee, setCallee] = useState(null)
    const [webcamEnabled, setWebCamEnabled] = useState(false)


    const setMeetingAndToken = async (token, meetingId, type, caller, callee) => {

        setCaller(caller)
        setCallee(callee)
        setToken(token)
        setMeetingId(meetingId)
        setWebCamEnabled(type === 'video' ? true : false)

    }


    return (token && meetingId && caller && callee) ?
        <MeetingProvider
            // joinWithoutUserInteraction={true}
            config={{
                meetingId,
                micEnabled: true,
                webcamEnabled: webcamEnabled,
                name: user?.email

            }}
            token={token}
        >
            <MeetingConsumer>

                {() => <MeetingGrid meetingId={meetingId} caller={caller} callee={callee} setMeetingAndToken={setMeetingAndToken} />}
            </MeetingConsumer>

        </MeetingProvider>
        : (

            <Contacts setMeetingAndToken={setMeetingAndToken} />
        )
}

export default CallScreen

