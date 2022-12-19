import React, { useState, useEffect } from "react";
import {
    SafeAreaView,
    TouchableOpacity,
    Text,
    TextInput,
    View,
    FlatList,
} from "react-native";
import {
    MeetingProvider,
    MeetingConsumer,
    useMeeting,
    useParticipant,
    MediaStream,
    RTCView,

} from "@videosdk.live/react-native-sdk";
import { createMeeting } from "../utils/api";
import { useNavigation } from "@react-navigation/native";
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';


const Button = ({ onPress, buttonText, backgroundColor }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                backgroundColor: backgroundColor,
                justifyContent: "center",
                alignItems: "center",
                padding: 12,
                borderRadius: 4,
            }}>
            <Text style={{ color: "white", fontSize: 12 }}>{buttonText}</Text>
        </TouchableOpacity>
    );
};


function JoinScreen(props) {
    const [meetingVal, setMeetingVal] = useState("");
    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: "#F6F6FF",
                justifyContent: "center",
                paddingHorizontal: 6 * 10,
            }}>
            <TouchableOpacity
                onPress={() => {
                    props.getMeetingId();
                }}
                style={{ backgroundColor: "#1178F8", padding: 12, borderRadius: 6 }}>
                <Text style={{ color: "white", alignSelf: "center", fontSize: 18 }}>
                    Create Meeting
                </Text>
            </TouchableOpacity>

            <Text
                style={{
                    alignSelf: "center",
                    fontSize: 22,
                    marginVertical: 16,
                    fontStyle: "italic",
                    color: "grey",
                }}>
                ---------- OR ----------
            </Text>
            <TextInput
                value={meetingVal}
                onChangeText={setMeetingVal}
                placeholder={"XXXX-XXXX-XXXX"}
                style={{
                    padding: 12,
                    borderWidth: 1,
                    borderRadius: 6,
                    fontStyle: "italic",
                }}
            />
            <TouchableOpacity
                style={{
                    backgroundColor: "#1178F8",
                    padding: 12,
                    marginTop: 14,
                    borderRadius: 6,
                }}
                onPress={() => {
                    props.getMeetingId(meetingVal);
                }}>
                <Text style={{ color: "white", alignSelf: "center", fontSize: 18 }}>
                    Join Meeting
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}


function ControlsContainer({ join, leave, toggleWebcam, changeWebcam, toggleMic, end }) {
    return (
        <View
            style={{
                padding: 24,
                flexDirection: "row",
                justifyContent: "space-between",
            }}>
            <Button
                onPress={() => {
                    join();
                }}
                buttonText={"Join"}
                backgroundColor={"#1178F8"}
            />
            <Button
                onPress={() => {
                    toggleWebcam();
                }}
                buttonText={"Toggle Webcam"}
                backgroundColor={"#1178F8"}
            />
            {/* <Button
                onPress={() => {
                    changeWebcam();
                }}
                buttonText={"Change Webcam"}
                backgroundColor={"#1178F8"}
            /> */}
            <Button
                onPress={() => {
                    toggleMic();
                }}
                buttonText={"Toggle Mic"}
                backgroundColor={"#1178F8"}
            />
            <Button
                onPress={() => {
                    end();
                    // leave();
                }}
                buttonText={"Leave"}
                backgroundColor={"#FF0000"}
            />
        </View>
    );
}


function ParticipantView({ participantId }) {
    const { webcamStream, webcamOn } = useParticipant(participantId);
    return (webcamOn && webcamStream) ?
        <RTCView
            streamURL={new MediaStream([webcamStream?.track]).toURL()}
            objectFit={"cover"}
            style={{
                height: 300,
                marginVertical: 8,
                marginHorizontal: 8,
            }}
        />
        : (
            <View
                style={{
                    backgroundColor: "grey",
                    height: 300,
                    justifyContent: "center",
                    alignItems: "center",
                }}>
                <Text style={{ fontSize: 16 }}>NO MEDIA</Text>
            </View>
        );
}

function ParticipantList({ participants }) {
    return participants.length > 0 ? (
        <FlatList
            data={participants}
            renderItem={({ item }) => {
                return <ParticipantView participantId={item} />;
            }}
        />
    ) : (
        <View
            style={{
                flex: 1,
                backgroundColor: "#F6F6FF",
                justifyContent: "center",
                alignItems: "center",
            }}>
            <Text style={{ fontSize: 20 }}>Press Join button to enter meeting.</Text>
        </View>
    );
}

function MeetingView() {
    // Get `participants` from useMeeting Hook
    // const navigation = useNavigation()
    const { join, leave, toggleWebcam, toggleMic, changeWebcam, participants, end } = useMeeting({});






    const participantsArrId = [...participants.keys()]; // Add this 

    useEffect(() => {
        join()
    }, [])


    return (
        <View style={{ flex: 1, backgroundColor: 'red' }}>
            <ParticipantList participants={participantsArrId} />
            <ControlsContainer
                join={join}
                leave={leave}
                toggleWebcam={toggleWebcam}
                toggleMic={toggleMic}
                changeWebcam={changeWebcam}
                end={end}
            />
        </View>
    );
}

export default function Videosdk({ route }) {

    // console.log(route.params)

    const navigation = useNavigation()
    const [meetingId, setMeetingId] = useState(route?.params?.meetingId);
    const [token, setToken] = useState(route?.params?.token)

    const getMeetingId = async (id) => {
        const meetingId = id == null ? await createMeeting({ token }) : id;
        console.log(meetingId)
        setMeetingId(meetingId);
    };



    return token && meetingId ? (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F6FF" }}>
            <MeetingProvider
                config={{
                    meetingId,
                    micEnabled: true,
                    webcamEnabled: true,

                    name: "Test User",
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

                                    meetingId: null
                                }

                                try {
                                    await firestore().collection('calling').doc(auth().currentUser.email).update(docData)
                                    console.log('cleared')
                                    navigation.goBack()
                                } catch (error) {
                                    console.log('error in removing caller', error)
                                }




                            } catch (error) {
                                console.log(error)
                            }

                        },
                    }}
                >
                    {() => <MeetingView />}
                </MeetingConsumer>

            </MeetingProvider>
        </SafeAreaView>
    ) : (
        <JoinScreen getMeetingId={getMeetingId} />
    );
}