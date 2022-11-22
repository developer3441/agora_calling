import { useState, useRef, useEffect } from 'react'
import AgoraRTC from "agora-rtc-sdk-ng"
import { GlobalProvider, useClient, useStart, useUsers } from './GlobalContext';
import Contacts from './contacts';
import { collection, doc, setDoc, getDoc, getDocs, onSnapshot, query } from "firebase/firestore";
import { useAuthState } from 'react-firebase-hooks/auth';
import { firestore, auth } from './firebase'
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


const Call = () => {
    return (
        <GlobalProvider>
            <Content />
        </GlobalProvider>
    );
}




const Content = () => {




    const setUsers = useUsers()[1]
    const [start, setStart] = useStart()
    const rtc = useClient()

    const [contacts, setContacts] = useState([])
    const [incoming, setIncoming] = useState(false);
    const [user] = useAuthState(auth);
    const [channel, setChannel] = useState(null)
    const [callToken, setCallToken] = useState(null)
    const [caller, setCaller] = useState(null)
    const [callee, setCallee] = useState(null)
    const [outgoing, setOutgoing] = useState(false)
    const timeOut = useRef(null)





    const options = {
        // Pass your app ID here.
        appId: "1a4bc8b224794fcf976d6d456d3beacd",
        // Set the channel name.
        // channel: "first",
        // // Pass a token if your project enables the App Certificate.
        // token: '007eJxTYLj3X3XPlf0LHaykzd90lBiHFD397nBOsVH0K6N6HhfH11AFBsNEk6RkiyQjIxNzS5O05DRLc7MUsxQTU7MU46TUxOSU9e6lyQ2BjAwf33xnZGSAQBCflSEts6i4hIEBAJUsITk=',
    };

    let init = async (name, token, id,) => {




        rtc.current.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        initClientEvents()
        const uid = await rtc.current.client.join(process.env.REACT_APP_APPID, name, token, id);
        // Create an audio track from the audio sampled by a microphone.
        rtc.current.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        // Create a video track from the video captured by a camera.
        rtc.current.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        //Adding a User to the Users State
        setUsers((prevUsers) => {
            return [...prevUsers, { uid: uid, audio: true, video: true, client: true, videoTrack: rtc.current.localVideoTrack }]
        })
        //Publishing your Streams
        await rtc.current.client.publish([rtc.current.localAudioTrack, rtc.current.localVideoTrack]);
        setStart(true)

    }




    const initClientEvents = () => {
        rtc.current.client.on("user-published", async (user, mediaType) => {
            // New User Enters
            await rtc.current.client.subscribe(user, mediaType);

            if (mediaType === "video") {
                const remoteVideoTrack = user.videoTrack;
                setUsers((prevUsers) => {
                    return [...prevUsers, { uid: user.uid, audio: user.hasAudio, video: user.hasVideo, client: false, videoTrack: remoteVideoTrack }]

                })
            }

            if (mediaType === "audio") {
                const remoteAudioTrack = user.audioTrack;
                remoteAudioTrack.play();
                setUsers((prevUsers) => {
                    return (prevUsers.map((User) => {
                        if (User.uid === user.uid) {
                            return { ...User, audio: user.hasAudio }
                        }
                        return User
                    }))

                })
            }
        });

        rtc.current.client.on("user-unpublished", (user, type) => {
            //User Leaves
            if (type === 'audio') {
                setUsers(prevUsers => {
                    return (prevUsers.map((User) => {
                        if (User.uid === user.uid) {
                            return { ...User, audio: !User.audio }
                        }
                        return User
                    }))
                })
            }
            if (type === 'video') {
                setUsers((prevUsers) => {
                    return prevUsers.filter(User => User.uid !== user.uid)
                })
            }
        });
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

    const dialCall = async (item, type) => {




        const callerTokenInfo = {
            "channelName": `${user?.email}${item?.id}`,
            "id": user?.email,
            "participantRole": "publisher"
        }
        const calleeTokenInfo = {
            "channelName": `${user?.email}${item?.id}`,
            "id": item?.id,
            "participantRole": "subscriber"
        }

        var callerConfig = {
            method: 'post',
            url: `${process.env.REACT_APP_BACKEND_LINK}/generate_token`,
            headers: {
                'Content-Type': 'application/json'
            },
            data: callerTokenInfo
        };

        var calleeConfig = {
            method: 'post',
            url: `${process.env.REACT_APP_BACKEND_LINK}/generate_token`,
            headers: {
                'Content-Type': 'application/json'
            },
            data: calleeTokenInfo

        };




        try {

            let callerResponse = await axios(callerConfig)
            callerResponse = callerResponse?.data
            console.log(callerResponse);


            let calleeResponse = await axios(calleeConfig)
            calleeResponse = calleeResponse?.data
            console.log(calleeResponse);



            const callerData = {
                callee: item?.id,
                caller: user?.email,
                type: type,
                calling: true,
                channelName: callerResponse?.channelName,
                token: callerResponse?.token,
                accepted: false

            }
            const calleeData = {
                callee: item?.id,
                caller: user?.email,
                type: type,
                calling: true,
                channelName: calleeResponse?.channelName,
                token: calleeResponse?.token,
                accepted: false
            }

            await setDoc(doc(firestore, "calling", user?.email), callerData);
            await setDoc(doc(firestore, "calling", item?.id), calleeData);

            timeOut.current = setTimeout(async () => {



                const result = await getDoc(doc(firestore, "calling", user?.email));


                if (result.data()?.accepted === false) {
                    expireCall(user?.email, item?.id)
                }

            }, 10000);


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
                channelName: null,
                token: null
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
                channelName: null,
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

    const leaveChannel = async () => {

        console.log('----------->in leave Channel')

        // Destroy the local audio and video tracks.
        await rtc?.current?.localVideoTrack?.setEnabled(false)
        await rtc?.current?.localAudioTrack?.setEnabled(false)
        await rtc?.current?.localAudioTrack?.close();
        await rtc?.current?.localVideoTrack?.close();
        await rtc?.current?.client?.leave();
        setUsers([])
        setStart(false)
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
                        init(data?.channelName, data?.token, user?.email)
                    } else {
                        setOutgoing(true)
                    }

                    setCaller(data?.caller)
                    setCallee(data?.callee)


                } else if (data.callee === user?.email) {
                    if (data?.accepted === false) {
                        setIncoming(true)
                        setChannel(data?.channelName)
                        setCallToken(data?.token)
                        setCaller(data?.caller)
                        setCallee(data?.callee)
                    } else if (data?.accepted === true) {
                        init(data?.channelName, data?.token, data?.callee)
                    }


                }
            } else if (data?.calling === false) {


                setIncoming(false)
                setOutgoing(false)
                setChannel(null)
                setCallToken(null)
                setCaller(null)
                setCallee(null)

                if (timeOut.current) {
                    clearTimeout(timeOut.current)
                }

                leaveChannel()


            }

        });
        return unsub;


    }, [])





    return (
        <div className="App">
            {start && <Videos endCall={endCall} />}
            {!start && <Contacts contacts={contacts} dialCall={dialCall} initFunc={init} />}

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

            {/* {!start && <ChannelForm initFunc={init} />} */}
        </div>
    )
}


const Videos = (props) => {



    const users = useUsers()[0]

    return (
        <div id='videos'>
            {users.length && users.map((user) => <Video endCall={props?.endCall} key={user.uid} user={user} />)}
        </div>
    )

}


export const Video = ({ user, endCall }) => {

    const vidDiv = useRef(null)

    const playVideo = () => {
        user.videoTrack.play(vidDiv.current)
    }

    const stopVideo = () => {
        user.videoTrack.stop()
    }

    useEffect(() => {
        playVideo()
        return () => {
            stopVideo()
        }
        // eslint-disable-next-line
    }, [])

    return (
        <div className='vid' ref={vidDiv} >
            <Controls endCall={endCall} user={user} />
        </div>
    )
}


export const Controls = ({ user, endCall }) => {

    const setStart = useStart()[1]
    const setUsers = useUsers()[1]
    const rtc = useClient()

    const leaveChannel = async () => {
        // Destroy the local audio and video tracks.
        await rtc.current.localVideoTrack.setEnabled(false)
        await rtc.current.localAudioTrack.setEnabled(false)
        await rtc.current.localAudioTrack.close();
        await rtc.current.localVideoTrack.close();
        await rtc.current.client.leave();
        setUsers([])
        setStart(false)
    }

    const mute = (type, id) => {
        if (type === 'audio') {
            setUsers(prevUsers => {
                return (prevUsers.map((user) => {
                    if (user.uid === id) {
                        user.client && rtc.current.localAudioTrack.setEnabled(!user.audio)
                        return { ...user, audio: !user.audio }
                    }
                    return user
                }))
            })
        }
        else if (type === 'video') {
            setUsers(prevUsers => {
                return prevUsers.map((user) => {
                    if (user.uid === id) {
                        user.client && rtc.current.localVideoTrack.setEnabled(!user.video)
                        return { ...user, video: !user.video }
                    }
                    return user
                })
            })
        }
    }

    return (
        <div className='controls'>
            {<p className={user.audio ? 'on' : ''} onClick={() => user.client && mute('audio', user.uid)}>Mic</p>}
            {<p className={user.video ? 'on' : ''} onClick={() => user.client && mute('video', user.uid)}>Video</p>}
            {user.client && <p onClick={() => endCall()}>Quit</p>}
        </div>
    )
}


const ChannelForm = ({ initFunc }) => {

    const [channelName, setChannelName] = useState('')
    const [appId, setappId] = useState('')
    return (
        <form className='join'>
            <input type="text" placeholder="Enter App Id" onChange={(e) => { setappId(e.target.value) }} />
            <input type="text" placeholder='Enter Channel Name' onChange={(e) => setChannelName(e.target.value)} />
            <button onClick={(e) => { e.preventDefault(); initFunc(channelName, appId); }}>Join Call</button>
        </form>
    );

}

export default Call;


