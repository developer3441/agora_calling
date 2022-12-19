// In App.js in a new project

import * as React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Contacts from '../screens/contacts';
import Call from '../screens/call';
import Videosdk from '../screens/videosdk';



const Stack = createNativeStackNavigator();

function AppNav() {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="Contacts" component={Contacts} />
                <Stack.Screen name="Call" component={Call} />
                <Stack.Screen name="CallScreen" component={Videosdk} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default AppNav;