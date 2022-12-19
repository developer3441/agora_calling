
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
    MeetingProvider,
    MeetingConsumer,
    useMeeting,
    useParticipant,
} from "@videosdk.live/react-sdk";
import { authToken, createMeeting } from "./api";
import ReactPlayer from 'react-player'
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthState } from 'react-firebase-hooks/auth';

import { doc, setDoc, } from "firebase/firestore";

import { firestore, auth } from './firebase'
import Contacts from "./contacts";

function JoinScreen({ getMeetingAndToken }) {
    const [meetingId, setMeetingId] = useState(null);
    const onClick = async () => {
        await getMeetingAndToken(meetingId);
    };
    return (
        <div>
            <input
                type="text"
                placeholder="Enter Meeting Id"
                onChange={(e) => {
                    setMeetingId(e.target.value);
                }}
            />
            <button onClick={onClick}>Join</button>
            {" or "}
            <button onClick={onClick}>Create Meeting</button>
        </div>
    );
}

function VideoComponent(props) {

    const micRef = useRef(null);
    const webcamRef = useRef(null);

    const { webcamStream, micStream, webcamOn, micOn, isLocal } = useParticipant(
        props.participantId
    );

    // React.useEffect(() => {
    //   if (webcamRef.current) {
    //     if (webcamOn) {
    //       const mediaStream = new MediaStream();
    //       const streams = webcamStream?.track
    //       if (streams) {
    //         mediaStream.addTrack(streams);
    //         webcamRef.current.srcObject = mediaStream;
    //         webcamRef.current.play().catch((error) => console.error('videoElem.current.play() failed', error));
    //       }
    //     } else {
    //       webcamRef.current.srcObject = null;
    //     }
    //   }
    // }, [webcamStream, webcamOn]);


    const videoStream = useMemo(() => {
        if (webcamOn) {
            try {
                const mediaStream = new MediaStream();

                const streams = webcamStream.track
                console.log('------->')
                if (streams) {
                    mediaStream.addTrack(streams);
                    return mediaStream;
                }
            } catch (error) {
                console.log('error', error)
            }



        }
    }, [webcamStream, webcamOn]);



    React.useEffect(() => {
        if (micRef.current) {
            if (micOn) {
                const mediaStream = new MediaStream();

                let streams = micStream?.track
                if (streams) {
                    mediaStream.addTrack(streams);
                    micRef.current.srcObject = mediaStream;
                    micRef.current.play().catch((error) => console.error('videoElem.current.play() failed', error));
                }
            } else {
                micRef.current.srcObject = null;
            }
        }
    }, [micStream, micOn]);

    return (
        <div key={props.participantId}>
            {micOn && micRef ? <audio ref={micRef} autoPlay muted={isLocal} /> : null}
            {webcamOn && videoStream ?
                (
                    <ReactPlayer
                        //
                        playsinline // very very imp prop
                        pip={false}
                        light={false}
                        // controls={true}
                        muted={true}
                        playing={true}
                        //
                        url={videoStream}
                        //
                        height={"200px"}
                        width={"200px"}
                        onError={(err) => {
                            console.log(err, "participant video error");
                        }}
                    />
                )


                /* <video height={'100%'} width={'100%'} ref={webcamRef} autoPlay /> */

                : null}
        </div>
    );
}

function Controls() {
    const { leave, toggleMic, toggleWebcam, end } = useMeeting();
    return (
        <div>
            <button onClick={end}>Leave</button>
            <button onClick={toggleMic}>toggleMic</button>
            <button onClick={toggleWebcam}>toggleWebcam</button>
        </div>
    );
}

function Container(props) {
    const [joined, setJoined] = useState(false);
    const { join } = useMeeting();
    const { participants } = useMeeting();
    const joinMeeting = () => {
        setJoined(true);
        join();
    };

    useEffect(() => {


        joinMeeting()
    }, [])


    return (
        <div className="container">
            <h3>Meeting Id: {props.meetingId}</h3>
            {joined ? (
                <div>
                    <Controls />
                    {[...participants.keys()].map((participantId) => (
                        <VideoComponent key={participantId} participantId={participantId} />
                    ))}
                </div>
            ) : (
                <button onClick={joinMeeting}>Join</button>
            )}
        </div>
    );
}

function CallScreen() {

    const { state } = useLocation();
    const [user] = useAuthState(auth);
    const [meetingId, setMeetingId] = useState(state?.meetingId);
    const [token, setToken] = useState(state?.token)
    const navigate = useNavigate()



    console.log(state)
    // const { meetingId, user, type } = state

    const getMeetingAndToken = async (id) => {
        const meetingId =
            id == null ? await createMeeting({ token: authToken }) : id;
        setMeetingId(meetingId);
    };

    return token && meetingId ? (
        <MeetingProvider
            // joinWithoutUserInteraction
            config={{
                meetingId,
                micEnabled: true,
                webcamEnabled: false,
                name: "C.V. Raman",
            }}
            token={token}>
            <MeetingConsumer
                {...{
                    onMeetingLeft: async () => {
                        console.log('left meeting')

                        try {
                            const docData = {
                                callee: null,
                                caller: null,
                                type: null,
                                calling: false,
                                // channelName: null,
                                meetingId: null

                            }

                            try {
                                await setDoc(doc(firestore, "calling", user?.email), docData);
                                console.log('cleared')
                                navigate('/')
                            } catch (error) {
                                console.log(error)
                            }



                        } catch (error) {
                            console.log(error)
                        }
                        //   navigation.navigate(SCREEN_NAMES.Join);
                    },
                }}
            >
                {() => <Container meetingId={meetingId} />}
            </MeetingConsumer>
        </MeetingProvider>
    ) : (

        // <Contacts setMeetingId={setMeetingId} />
        <JoinScreen getMeetingAndToken={getMeetingAndToken} />
    );
}

export default CallScreen;