import React, { useEffect, useState, useRef } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native'
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Modal from "react-native-modal";
import { BACKEND_URL } from '@env'



const Contacts = () => {

    const [contacts, setContacts] = useState([])
    const navigation = useNavigation()
    const [caller, setCaller] = useState(null)
    const [callee, setCallee] = useState(null)
    const [incoming, setIncoming] = useState(false)
    const [outgoing, setOutgoing] = useState(false)
    const [channel, setChannel] = useState(null)
    const [callToken, setCallToken] = useState(null)
    const timeOut = useRef(null)



    const getContacts = async () => {
        let res = await firestore().collection('calling').get()
        console.log(res.docs[0].data())
        let tempArr = []
        res.docs.forEach(el => {
            if (el.id !== auth().currentUser.email)
                tempArr.push({ ...el.data(), id: el.id })
        })
        setContacts(tempArr);
    }


    const checkAvailable = async (id) => {
        const result = await firestore().collection('calling').doc(id).get()
        console.log(result.data())
        if (result?.data().calling === true) {
            console.log('Busy')
            return false;

        } else {
            console.log('Available')
            return true;
        }
    }



    const callOther = async (item, type) => {

        const userEmail = auth()?.currentUser?.email

        const online = await checkAvailable(item?.id)



        if (!online) {
            alert('Already in call')
            return;
        }



        const callerTokenInfo = {
            "channelName": `${userEmail}${item?.id}`,
            "id": userEmail,
            "participantRole": "publisher"
        }
        const calleeTokenInfo = {
            "channelName": `${userEmail}${item?.id}`,
            "id": item?.id,
            "participantRole": "subscriber"
        }




        var callerConfig = {
            method: 'POST',
            headers: {

                'Content-Type': 'application/json'
            },
            body: JSON.stringify(callerTokenInfo)
        };

        var calleeConfig = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(calleeTokenInfo)

        };

        try {


            let callerResponse = await fetch(`${'http://192.168.18.7:5000'}/generate_token`, callerConfig)
            callerResponse = await callerResponse.json()
            console.log(callerResponse);


            let calleeResponse = await fetch(`${'http://192.168.18.7:5000'}/generate_token`, calleeConfig)
            calleeResponse = await calleeResponse.json()
            console.log(calleeResponse);

            const callerData = {
                callee: item?.id,
                caller: userEmail,
                type: type,
                calling: true,
                channelName: callerResponse?.channelName,
                token: callerResponse?.token,
                accepted: false
            }
            const calleeData = {
                callee: item?.id,
                caller: userEmail,
                type: type,
                calling: true,
                channelName: calleeResponse?.channelName,
                token: calleeResponse?.token,
                accepted: false
            }

            await firestore().collection('calling').doc(item.id).update(
                calleeData
            )
            await firestore().collection('calling').doc(auth().currentUser.email).update(
                callerData
            )


            timeOut.current = setTimeout(async () => {
                // console.log('5 seconds passed')

                const result = await firestore().collection('calling').doc(auth().currentUser.email).get()
                console.log(result.data())
                if (result?.data().accepted === false) {
                    expireCall(auth().currentUser.email, item?.id)
                }

            }, 60000);




        } catch (error) {
            console.log(error)
        }

    }



    const expireCall = async (callerData, calleeData) => {
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
                await firestore().collection('calling').doc(callerData).update(docData)
            } catch (error) {
                console.log('error in removing caller', error)
            }

            try {
                await firestore().collection('calling').doc(calleeData).update(docData)
            } catch (error) {
                console.log('error in removing callee', error)
            }


        } catch (error) {
            console.log(error)
        }
    }


    const acceptCall = async () => {



        try {
            const callerData = {
                // callee: item?.id,
                // caller: userEmail,
                // type: type,
                // calling: true,
                // channelName: callerResponse?.channelName,
                // token: callerResponse?.token,
                accepted: true
            }
            const calleeData = {
                // callee: item?.id,
                // caller: userEmail,
                // type: type,
                // calling: true,
                // channelName: calleeResponse?.channelName,
                // token: calleeResponse?.token,
                accepted: true
            }

            await firestore().collection('calling').doc(callee).update(
                calleeData
            )
            await firestore().collection('calling').doc(caller).update(
                callerData
            )
        } catch (error) {
            console.log(error)
        }


    }


    const declineCall = async () => {

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


    useEffect(() => {
        getContacts()
        const subscriber = firestore()
            .collection('calling')
            .doc(auth().currentUser.email)
            .onSnapshot(documentSnapshot => {
                console.log('User data: ', { ...documentSnapshot.data(), id: documentSnapshot.id });

                let data = { id: documentSnapshot.id, ...documentSnapshot.data() };
                if (data?.calling === true) {
                    if (data?.caller === auth().currentUser.email) {

                        if (data?.accepted === true) {
                            setOutgoing(false)
                            clearTimeout(timeOut.current)
                            navigation.navigate('Call', { id: auth().currentUser.email, channelName: data?.channelName, token: data?.token, caller: data?.caller, callee: data?.callee, type: data?.type })

                        } else {
                            setOutgoing(true)
                        }


                        setCaller(data.caller)
                        setCallee(data.callee)

                    } else if (data.callee === auth().currentUser?.email) {

                        if (data?.accepted === false) {
                            setCaller(data.caller)
                            setCallee(data.callee)
                            setChannel(data?.channelName)
                            setCallToken(data?.token)
                            setIncoming(true)
                        } else if (data?.accepted === true) {
                            setIncoming(false)
                            navigation.navigate('Call', { id: auth().currentUser.email, channelName: data?.channelName, token: data?.token, caller: data?.caller, callee: data?.callee, type: data?.type })
                        }

                    }

                } else {
                    setCaller(null)
                    setCallee(null)
                    setChannel(null)
                    setCallToken(null)
                    setIncoming(false)
                    setOutgoing(false)
                    if (timeOut.current) {
                        clearTimeout(timeOut.current)
                    }
                }


            });

        // Stop listening for updates when no longer required
        return () => subscriber();



    }, [])



    return (
        <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 10 }}>
            <FlatList
                data={contacts}
                renderItem={({ item }) => <View style={{ padding: 10, width: '100%', backgroundColor: '#FFC0CB', marginVertical: 5, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{item?.id}</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity onPress={() => callOther(item, 'audio')} style={{ margin: 10, padding: 5, backgroundColor: 'skyblue' }}>
                            <Text>{'Audio'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => callOther(item, 'video')} style={{ margin: 10, padding: 5, backgroundColor: 'skyblue' }}>
                            <Text>{'Video'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>}

                ListFooterComponent={() => <TouchableOpacity onPress={() => auth().signOut()} style={styles.signoutBtn}>
                    <Text
                        style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}
                    >Sign Out</Text>
                </TouchableOpacity>}

            />


            <Modal isVisible={incoming}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: 'white' }}>{callee?.callee}</Text>
                    <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-around' }}>
                        <TouchableOpacity onPress={() => declineCall()} style={{ width: 50, height: 50, backgroundColor: 'red', borderRadius: 50 }} />
                        <TouchableOpacity onPress={() => acceptCall()} style={{ width: 50, height: 50, backgroundColor: 'green', borderRadius: 50 }} />
                    </View>
                </View>
            </Modal>

            <Modal isVisible={outgoing}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 48 }}>Calling...</Text>
                    {/* <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-around' }}>
                        <TouchableOpacity onPress={() => declineCall()} style={{ width: 50, height: 50, backgroundColor: 'red', borderRadius: 50 }} />
                        <TouchableOpacity onPress={() => acceptCall()} style={{ width: 50, height: 50, backgroundColor: 'green', borderRadius: 50 }} />
                    </View> */}
                </View>
            </Modal>

        </View>
    )
}

export default Contacts

const styles = StyleSheet.create({
    signoutBtn: {
        // position: 'absolute',
        // right: 20,
        // bottom: 30,
        backgroundColor: 'orange',
        borderRadius: 20,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20

    }
})