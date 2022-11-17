import { StyleSheet, Text, View, TextInput, Button } from 'react-native'
import React, { useState } from 'react'
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const Auth = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');


    const signUp = () => {
        if (!email || !password) {
            alert('All fields are required!')
            return
        }
        auth()
            .createUserWithEmailAndPassword(email, password)
            .then(() => {
                console.log('User account created & signed in!');
                firestore().collection('calling').doc(email).set({
                    calling: false,
                    token: null,
                    channelName: null,

                })
                    .then(() => {
                        console.log('User added!');
                    });

            })
            .catch(error => {
                if (error.code === 'auth/email-already-in-use') {
                    console.log('That email address is already in use!');
                    alert('That email address is already in use!')
                }

                if (error.code === 'auth/invalid-email') {
                    console.log('That email address is invalid!');
                    alert('That email address is invalid!')
                }

                console.error(error);
            });
    }


    const signIn = () => {

        if (!email || !password) {
            alert('All fields are required!')
            return
        }

        auth()
            .signInWithEmailAndPassword(email, password)
            .then(() => {
                console.log('User account created & signed in!');
            })
            .catch(error => {
                // if (error.code === 'auth/email-already-in-use') {
                //     console.log('That email address is already in use!');

                // }

                // if (error.code === 'auth/invalid-email') {
                //     console.log('That email address is invalid!');

                // }

                alert('Error Logging In')

                console.log(error);
            });
    }


    return (
        <View style={styles.container}>
            <View style={styles.inputView}>
                <TextInput
                    style={styles.TextInput}
                    placeholder="Email."
                    placeholderTextColor="#003f5c"
                    onChangeText={(email) => setEmail(email)}
                />
            </View>

            <View style={styles.inputView}>
                <TextInput
                    style={styles.TextInput}
                    placeholder="Password."
                    placeholderTextColor="#003f5c"
                    secureTextEntry={true}
                    onChangeText={(password) => setPassword(password)}
                />
            </View>

            <Button style={{ marginBottom: 20 }} title='Sign Up' onPress={() => signUp()} />
            <Button title='Login' onPress={() => signIn()} />
        </View>
    )
}

export default Auth

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 100
    }
    ,
    inputView: {
        backgroundColor: "#FFC0CB",
        borderRadius: 10,
        width: "70%",
        height: 45,
        marginBottom: 20,
        // alignItems: "center",
    },

    TextInput: {
        height: 50,
        flex: 1,
        padding: 10,
        // marginLeft: 20
    }
})