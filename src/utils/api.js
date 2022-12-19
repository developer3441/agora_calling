const API_BASE_URL = "https://api.videosdk.live";
export const token = null
const API_AUTH_URL = 'http://localhost:9000';

export const authToken = null
export const getToken = async () => {
    if (token && API_AUTH_URL) {
        console.error(
            "Error: Provide only ONE PARAMETER - either Token or Auth API"
        );
    } else if (token) {
        return token;
    } else if (API_AUTH_URL) {
        const res = await fetch(`${API_AUTH_URL}/get-token`, {
            method: "GET",
        });
        const { token } = await res.json();
        return token;
    } else {
        console.error("Error: ", Error("Please add a token or Auth Server URL"));
    }
};

export const createMeeting = async ({ token }) => {


    const url = `${API_BASE_URL}/v2/rooms`;
    const options = {
        method: "POST",
        headers: { Authorization: token, "Content-Type": "application/json" },
    };

    const { roomId } = await fetch(url, options)
        .then((response) => response.json())
        .catch((error) => console.error("error", error));

    return roomId;
};

export const validateMeeting = async ({ roomId, token }) => {
    const url = `${API_BASE_URL}/v2/rooms/validate/${roomId}`;

    const options = {
        method: "GET",
        headers: { Authorization: token, "Content-Type": "application/json" },
    };

    const result = await fetch(url, options)
        .then((response) => response.json()) //result will have meeting id
        .catch((error) => console.error("error", error));

    return result ? result.roomId === roomId : false;
};
