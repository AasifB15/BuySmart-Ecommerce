import axios from "axios";

/*
 * Base URL of the BuySmart Spring Boot backend.
 * Configurable via environment variable with fallback to local development port.
 */
const backendApiService = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
});

/*
 * Add JWT token automatically to protected API requests and handle multipart uploads.
 */
backendApiService.interceptors.request.use(
    (requestConfiguration) => {
        const authenticationToken =
            localStorage.getItem("buysmartAuthenticationToken") ||
            localStorage.getItem("shoporaAuthenticationToken");

        if (authenticationToken) {
            requestConfiguration.headers.Authorization = `Bearer ${authenticationToken}`;
        }

        // If request data is FormData (file upload), let Axios & browser set boundary automatically
        if (requestConfiguration.data instanceof FormData) {
            delete requestConfiguration.headers["Content-Type"];
        }

        return requestConfiguration;
    },
    (requestError) => {
        return Promise.reject(requestError);
    }
);

/*
 * Automatic handling of expired or revoked authentication sessions.
 */
backendApiService.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const hadToken =
                localStorage.getItem("buysmartAuthenticationToken") ||
                localStorage.getItem("shoporaAuthenticationToken");
            if (hadToken && !window.location.pathname.includes("/login")) {
                localStorage.removeItem("buysmartAuthenticationToken");
                localStorage.removeItem("buysmartCurrentUser");
                localStorage.removeItem("shoporaAuthenticationToken");
                localStorage.removeItem("shoporaCurrentUser");
                window.dispatchEvent(new CustomEvent("buysmart:session-expired"));
            }
        }
        return Promise.reject(error);
    }
);

export default backendApiService;