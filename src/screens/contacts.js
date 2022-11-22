import React, { useEffect, useState } from 'react'
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
    const [channel, setChannel] = useState(null)
    const [callToken, setCallToken] = useState(null)



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



    const callOther = async (item, type = 'audio') => {

        const userEmail = auth()?.currentUser?.email


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


            let callerResponse = await fetch(`${'http://192.168.18.22:5000'}/generate_token`, callerConfig)
            callerResponse = await callerResponse.json()
            console.log(callerResponse);


            let calleeResponse = await fetch(`${'http://192.168.18.22:5000'}/generate_token`, calleeConfig)
            calleeResponse = await calleeResponse.json()
            console.log(calleeResponse);

            const callerData = {
                callee: item?.id,
                caller: userEmail,
                type: type,
                calling: true,
                channelName: callerResponse?.channelName,
                token: callerResponse?.token
            }
            const calleeData = {
                callee: item?.id,
                caller: userEmail,
                type: type,
                calling: true,
                channelName: calleeResponse?.channelName,
                token: calleeResponse?.token
            }

            await firestore().collection('calling').doc(item.id).update(
                calleeData
            )
            await firestore().collection('calling').doc(auth().currentUser.email).update(
                callerData
            )


        } catch (error) {
            console.log(error)
        }

    }



    const acceptCall = async () => {
        setIncoming(false)
        navigation.navigate('Call', { id: auth().currentUser.email, channelName: channel, token: callToken, caller: caller, callee: callee })
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

                        navigation.navigate('Call', { id: auth().currentUser.email, channelName: data?.channelName, token: data?.token, caller: data?.caller, callee: data?.callee })

                    } else if (data.callee === auth().currentUser?.email) {

                        setCaller(data.caller)
                        setCallee(data.callee)
                        setChannel(data?.channelName)
                        setCallToken(data?.token)
                        setIncoming(true)
                    }

                } else {
                    setCaller(null)
                    setCallee(null)
                    setChannel(null)
                    setCallToken(null)
                    setIncoming(false)
                }


            });

        // Stop listening for updates when no longer required
        return () => subscriber();



    }, [])



    return (
        <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 10 }}>
            <FlatList
                data={contacts}
                renderItem={({ item }) => <TouchableOpacity onPress={() => callOther(item)} style={{ padding: 10, width: '100%', backgroundColor: '#FFC0CB', marginVertical: 5, borderRadius: 10 }}><Text>{item?.id}</Text></TouchableOpacity>}

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