import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native'
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Modal from "react-native-modal";

const Contacts = () => {


    const [contacts, setContacts] = useState([])
    const navigation = useNavigation()
    const [callee, setCallee] = useState(null)
    const [incoming, setIncoming] = useState(false)
    const [callingTo, setCallingTo] = useState(null)



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



    const callOther = async (item) => {
        try {
            await firestore().collection('calling').doc(item.id).update(
                {
                    channelName: 'first',
                    token: '007eJxTYLj3X3XPlf0LHaykzd90lBiHFD397nBOsVH0K6N6HhfH11AFBsNEk6RkiyQjIxNzS5O05DRLc7MUsxQTU7MU46TUxOSU9e6lyQ2BjAwf33xnZGSAQBCflSEts6i4hIEBAJUsITk=',
                    caller: auth().currentUser.email,
                    callee: item.id,
                    calling: true
                }
            )

            navigation.navigate('Call', { id: auth().currentUser.email, channelName: 'first', token: '007eJxTYLj3X3XPlf0LHaykzd90lBiHFD397nBOsVH0K6N6HhfH11AFBsNEk6RkiyQjIxNzS5O05DRLc7MUsxQTU7MU46TUxOSU9e6lyQ2BjAwf33xnZGSAQBCflSEts6i4hIEBAJUsITk=' })
        } catch (error) {
            console.log(error)
        }

    }



    const acceptCall = async () => {
        setIncoming(false)
        navigation.navigate('Call', { id: auth().currentUser.email, channelName: 'first', token: '007eJxTYLj3X3XPlf0LHaykzd90lBiHFD397nBOsVH0K6N6HhfH11AFBsNEk6RkiyQjIxNzS5O05DRLc7MUsxQTU7MU46TUxOSU9e6lyQ2BjAwf33xnZGSAQBCflSEts6i4hIEBAJUsITk=' })
    }


    const declineCall = async () => {

        try {
            await firestore().collection('calling').doc(auth().currentUser.email).update(
                {
                    channelName: null,
                    token: null,
                    caller: null,
                    callee: null,
                    calling: false
                }
            )

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
                if (documentSnapshot?.data()?.calling === true) {
                    if (documentSnapshot.id === auth().currentUser.email) {
                        setCallee({ ...documentSnapshot.data(), id: documentSnapshot.id })
                        setIncoming(true)
                    }

                } else {
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