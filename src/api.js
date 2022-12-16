const API_BASE_URL = "https://api.videosdk.live";
const VIDEOSDK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI0ZTk5ZDY0OS0zNGZlLTQzYTUtYTNmYS04YTc5YmU0NThjNjEiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTY3MTExNTY3NCwiZXhwIjoxNjcxNzIwNDc0fQ.KP59PMhD-gK-b6Ia07-P6_I_BSAhdItdVyoqVe3qqKg'
const API_AUTH_URL = process.env.REACT_APP_AUTH_URL;

export const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI0ZTk5ZDY0OS0zNGZlLTQzYTUtYTNmYS04YTc5YmU0NThjNjEiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTY3MTExNTY3NCwiZXhwIjoxNjcxNzIwNDc0fQ.KP59PMhD-gK-b6Ia07-P6_I_BSAhdItdVyoqVe3qqKg'
export const getToken = async () => {
    if (VIDEOSDK_TOKEN && API_AUTH_URL) {
        console.error(
            "Error: Provide only ONE PARAMETER - either Token or Auth API"
        );
    } else if (VIDEOSDK_TOKEN) {
        return VIDEOSDK_TOKEN;
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
