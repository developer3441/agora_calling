import React, { useRef, useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import {
    ClientRoleType,
    createAgoraRtcEngine,
    IRtcEngine,
    RtcSurfaceView,
    ChannelProfileType,
} from 'react-native-agora';
import { useNavigation, useRoute } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { APP_ID } from "@env"

const Call = () => {
    const navigation = useNavigation()
    const route = useRoute()



    const appId = APP_ID;
    const channelName = route.params.channelName;
    const token = route.params.token;
    const uid = route.params.id;
    const caller = route.params.caller;
    const callee = route.params.callee;
    const callType = route.params.type
    const [isMuted, setIsMuted] = useState(false)
    const [move, setMove] = useState(false)


    const agoraEngineRef = useRef(); // Agora engine instance
    const [isJoined, setIsJoined] = useState(false); // Indicates if the local user has joined the channel
    const [remoteUid, setRemoteUid] = useState(0); // Uid of the remote user
    const [message, setMessage] = useState('hello user'); // Message to the user




    const getPermission = async () => {
        if (Platform.OS === 'android') {
            await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                PermissionsAndroid.PERMISSIONS.CAMERA,
            ]);
        }
    };


    function showMessage(msg) {
        setMessage(msg);
    }


    const join = async () => {

        if (isJoined) {
            return;
        }

        if (message === 'left') { return }

        try {
            agoraEngineRef.current?.setChannelProfile(
                ChannelProfileType.ChannelProfileCommunication,
            );
            agoraEngineRef.current?.startPreview();
            agoraEngineRef.current.joinChannelWithUserAccount(token, channelName, uid, {
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
            });
        } catch (e) {
            console.log(e);
        }
    };


    const endCall = async () => {


        console.log('endCall');
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
                await firestore().collection('calling').doc(caller).update(docData)
            } catch (error) {
                console.log('error in removing caller', error)
            }

            try {
                await firestore().collection('calling').doc(callee).update(docData)
            } catch (error) {
                console.log('error in removing callee', callee)
            }



        } catch (error) {
            console.log(error)
        }
    }


    const leave = async () => {
        try {
            // console.log('calling leave')
            await agoraEngineRef.current?.leaveChannel();
            setRemoteUid(0);
            setIsJoined(false);
            showMessage('left');
            navigation.goBack()

        } catch (e) {
            console.log('++++++>', e);
        }
    };




    useEffect(() => {
        // Initialize Agora engine when the app starts




        setupVideoSDKEngine();


        const subscriber = firestore()
            .collection('calling')
            .doc(auth().currentUser.email)
            .onSnapshot(documentSnapshot => {
                let data = { id: documentSnapshot.id, ...documentSnapshot.data() };

                if (data?.calling === false) {
                    console.log('in listener')
                    leave()
                }


            });

        // Stop listening for updates when no longer required

        return () => subscriber();

    }, []);

    const setupVideoSDKEngine = async () => {
        try {
            // use the helper function to get permissions
            await getPermission();
            try {
                agoraEngineRef.current = createAgoraRtcEngine();
            } catch (error) {
                console.log('erroorr', error)
            }

            const agoraEngine = agoraEngineRef.current;
            await agoraEngine.registerEventHandler({
                onJoinChannelSuccess: () => {
                    showMessage('Successfully joined the channel ' + channelName);
                    setIsJoined(true);
                },
                onUserJoined: (_connection, Uid) => {
                    showMessage('Remote user joined with uid ' + Uid);
                    setRemoteUid(Uid);
                },
                onUserOffline: (_connection, Uid) => {
                    showMessage('Remote user left the channel. uid: ' + Uid);
                    setRemoteUid(0);


                },
            });
            await agoraEngine.initialize({
                appId: appId,
            });
            if (callType === 'video') {
                await agoraEngine.enableVideo();
            }


            join()

        } catch (e) {
            console.log('------->___', e);
        }
    };



    return (
        <SafeAreaView style={styles.main}>
            <Text style={styles.head}>Agora Video Calling Quickstart</Text>
            <View style={styles.btnContainer}>
                <Text onPress={async () => {

                    if (isMuted) {
                        await agoraEngineRef?.current?.enableAudio()
                        setIsMuted(false)
                    } else {
                        await agoraEngineRef?.current?.disableAudio()
                        setIsMuted(true)
                    }


                }} style={styles.button}>
                    {isMuted ? 'Unmute' : 'Mute'}
                </Text>
                <Text onPress={() => agoraEngineRef?.current?.switchCamera()} style={styles.button}>
                    Switch Camera
                </Text>
                <Text onPress={endCall} style={styles.button}>
                    Leave
                </Text>
            </View>
            {callType === 'video' ? <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContainer}>
                {isJoined ? (
                    <React.Fragment key={0}>
                        <RtcSurfaceView canvas={{ uid: 0 }} style={styles.videoView} />
                        <Text>Local user uid: {uid}</Text>
                    </React.Fragment>
                ) : (
                    <Text>Join a channel</Text>
                )}
                {isJoined && remoteUid !== 0 ? (
                    <React.Fragment key={remoteUid}>
                        <RtcSurfaceView
                            canvas={{ uid: remoteUid }}
                            style={styles.videoView}
                        />
                        <Text>Remote user uid: {remoteUid}</Text>
                    </React.Fragment>
                ) : (
                    <Text>Waiting for a remote user to join</Text>
                )}
                <Text style={styles.info}>{message}</Text>
            </ScrollView> :
                <View style={{ backgroundColor: 'skyblue', flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                    <Text>
                        {caller === auth()?.currentUser?.email ? callee.toString() : callee === auth()?.currentUser?.email ? caller.toString() : 'audio'}
                    </Text>
                </View>
            }
        </SafeAreaView>
    );



};

const styles = StyleSheet.create({
    button: {
        paddingHorizontal: 25,
        paddingVertical: 4,
        fontWeight: 'bold',
        color: '#ffffff',
        backgroundColor: '#0055cc',
        margin: 5,
    },
    main: { flex: 1, alignItems: 'center' },
    scroll: { flex: 1, backgroundColor: '#ddeeff', width: '100%' },
    scrollContainer: { alignItems: 'center' },
    videoView: { width: '90%', height: 200, borderColor: 'red', borderRadius: 10, borderWidth: 2 },
    btnContainer: { flexDirection: 'row', justifyContent: 'center' },
    head: { fontSize: 20 },
    info: { backgroundColor: '#ffffe0', color: '#0000ff' }
});

export default Call;
