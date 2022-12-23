import React, { useState } from 'react'
import { useCreateUserWithEmailAndPassword, useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth, firestore } from './firebase'
import { doc, setDoc, Timestamp } from "firebase/firestore";




function Auth() {

    const [email, setEmail] = useState(null)
    const [password, setPassword] = useState(null)

    // const { doc, setDoc } = firestore


    const [
        createUserWithEmailAndPassword,
        user,
        loading,
        error,
    ] = useCreateUserWithEmailAndPassword(auth);


    const [
        signInWithEmailAndPassword,
        userLogin,
        loadingLogin,
        errorLogin

    ] = useSignInWithEmailAndPassword(auth);



    const signup = () => {

        createUserWithEmailAndPassword(email, password).then(
            async () => {


                const docData = {
                    caller: null,
                    callee: null,
                    calling: false,
                    channelName: null,
                    token: null
                }

                try {
                    await setDoc(doc(firestore, "calling", email), docData);
                } catch (error) {
                    console.log(error)
                }


            }
        )

    }


    if (loading) {
        return <div>
            Loading...
            {loading}
        </div>
    }
    if (error) {
        return <div>
            {'error'}
        </div>
    }


    if (loadingLogin) {
        return <div>
            Logging In...
            {loading}
        </div>
    }
    if (errorLogin) {
        return <div>
            {'Login error'}
        </div>
    }

    return (
        <div className='auth_container'>
            <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />

            <div>
                <button onClick={() => signInWithEmailAndPassword(email, password)} >Login</button>
                <button onClick={() => signup()}>SignUp</button>
            </div>
        </div>
    )
}

export default Auth