import {
    createContext,
    useContext,
    useState,
} from "react";

import backendApiService from "../services/backendApiService";


const AuthenticationContext =
    createContext(null);


/*
 * =========================================================
 * AUTHENTICATION CONTEXT PROVIDER
 * =========================================================
 *
 * Responsible for:
 *
 * - Login
 * - Registration
 * - Logout
 * - Current user information
 * - JWT token management
 * - User role management
 * - Updating current user information
 *
 */

export function AuthenticationContextProvider({
                                                  children,
                                              }) {


    /*
     * =========================================================
     * CURRENT USER
     * =========================================================
     */

    const [currentUser, setCurrentUser] = useState(() => {

        const savedUser =
            localStorage.getItem(
                "buysmartCurrentUser"
            ) ||
            localStorage.getItem(
                "shoporaCurrentUser"
            );


        if (!savedUser) {
            return null;
        }


        try {

            return JSON.parse(savedUser);

        } catch {

            localStorage.removeItem(
                "buysmartCurrentUser"
            );
            localStorage.removeItem(
                "shoporaCurrentUser"
            );

            return null;
        }

    });


    /*
     * =========================================================
     * AUTHENTICATION STATUS
     * =========================================================
     */

    const [isUserAuthenticated, setIsUserAuthenticated] =
        useState(() => {

            return Boolean(
                localStorage.getItem(
                    "buysmartAuthenticationToken"
                ) ||
                localStorage.getItem(
                    "shoporaAuthenticationToken"
                )
            );

        });


    /*
     * =========================================================
     * STORE AUTHENTICATION INFORMATION
     * =========================================================
     */

    const storeAuthenticationInformation = (
        authenticationData
    ) => {


        if (!authenticationData?.token) {

            throw new Error(
                "Authentication token was not received from the server."
            );

        }


        const userInformation = {

            userId:
            authenticationData.userId,

            fullName:
            authenticationData.fullName,

            email:
            authenticationData.email,

            role:
            authenticationData.role,

            phoneNumber:
                authenticationData.phoneNumber || "",

        };


        localStorage.setItem(
            "buysmartAuthenticationToken",
            authenticationData.token
        );

        localStorage.setItem(
            "shoporaAuthenticationToken",
            authenticationData.token
        );


        localStorage.setItem(
            "buysmartCurrentUser",
            JSON.stringify(userInformation)
        );

        localStorage.setItem(
            "shoporaCurrentUser",
            JSON.stringify(userInformation)
        );


        setCurrentUser(
            userInformation
        );


        setIsUserAuthenticated(
            true
        );


        return userInformation;

    };


    /*
     * =========================================================
     * LOGIN EXISTING USER
     * =========================================================
     */

    const loginUser = async (
        email,
        password
    ) => {


        const loginRequest = {

            email:
                email.trim(),

            password:
            password,

        };


        const response =
            await backendApiService.post(
                "/auth/login",
                loginRequest
            );


        const authenticationData =
            response.data?.data;


        return storeAuthenticationInformation(
            authenticationData
        );

    };


    /*
     * =========================================================
     * SEND OTP FOR EMAIL AUTHENTICATION
     * =========================================================
     */

    const sendOtp = async (email, purpose = "LOGIN") => {
        const response = await backendApiService.post(
            "/auth/otp/send",
            {
                email: email.trim(),
                purpose,
            }
        );

        return response.data?.data;
    };


    /*
     * =========================================================
     * LOGIN USER VIA OTP
     * =========================================================
     */

    const loginWithOtp = async (email, otp, purpose = "LOGIN") => {
        const response = await backendApiService.post(
            "/auth/otp/verify",
            {
                email: email.trim(),
                otp: otp.trim(),
                purpose,
            }
        );

        const authenticationData = response.data?.data;

        return storeAuthenticationInformation(
            authenticationData
        );
    };


    /*
     * =========================================================
     * REGISTER NEW USER
     * =========================================================
     */

    const registerUser = async (
        registrationInformation
    ) => {


        const response =
            await backendApiService.post(
                "/auth/register",
                registrationInformation
            );


        const authenticationData =
            response.data?.data;


        return storeAuthenticationInformation(
            authenticationData
        );

    };


    /*
     * =========================================================
     * UPDATE CURRENT USER
     * =========================================================
     *
     * Used when the customer changes profile information.
     *
     * Example:
     *
     * Customer changes:
     *     Aasif
     *
     * to:
     *     Aasif Khan
     *
     * Backend updates MySQL.
     *
     * This function then updates:
     *
     * - React currentUser
     * - localStorage
     *
     * so the new name appears immediately
     * throughout the application.
     *
     */

    const updateCurrentUser = (updatedUserInformation) => {

        if (!updatedUserInformation) {
            return;
        }

        if (updatedUserInformation.token) {
            localStorage.setItem(
                "buysmartAuthenticationToken",
                updatedUserInformation.token
            );
            localStorage.setItem(
                "shoporaAuthenticationToken",
                updatedUserInformation.token
            );
            setIsUserAuthenticated(true);
        }

        setCurrentUser((previousUser) => {


            if (!previousUser) {
                return previousUser;
            }


            const updatedUser = {

                ...previousUser,

                userId:
                    updatedUserInformation.userId ??
                    previousUser.userId,

                fullName:
                    updatedUserInformation.fullName ??
                    previousUser.fullName,

                email:
                    updatedUserInformation.email ??
                    previousUser.email,

                role:
                    updatedUserInformation.role ??
                    previousUser.role,

                phoneNumber:
                    updatedUserInformation.phoneNumber ??
                    previousUser.phoneNumber ??
                    "",

            };


            /*
             * Keep localStorage synchronized
             * with the updated React state.
             */

            localStorage.setItem(
                "buysmartCurrentUser",
                JSON.stringify(updatedUser)
            );

            localStorage.setItem(
                "shoporaCurrentUser",
                JSON.stringify(updatedUser)
            );


            return updatedUser;

        });

    };


    /*
     * =========================================================
     * CHECK SELLER ACCOUNT
     * =========================================================
     */

    const isSellerAccount = () => {

        return (

            currentUser?.role === "ROLE_SELLER" ||

            currentUser?.role === "SELLER"

        );

    };


    /*
     * =========================================================
     * CHECK ADMINISTRATOR ACCOUNT
     * =========================================================
     */

    const isAdministratorAccount = () => {

        return (

            currentUser?.role === "ROLE_ADMIN" ||

            currentUser?.role === "ADMIN"

        );

    };


    /*
     * =========================================================
     * CHECK CUSTOMER ACCOUNT
     * =========================================================
     */

    const isCustomerAccount = () => {

        return (

            currentUser?.role === "ROLE_CUSTOMER" ||

            currentUser?.role === "CUSTOMER"

        );

    };


    /*
     * =========================================================
     * LOGOUT CURRENT USER
     * =========================================================
     */

    const logoutUser = () => {

        localStorage.removeItem(
            "buysmartAuthenticationToken"
        );
        localStorage.removeItem(
            "buysmartCurrentUser"
        );
        localStorage.removeItem(
            "shoporaAuthenticationToken"
        );
        localStorage.removeItem(
            "shoporaCurrentUser"
        );


        setCurrentUser(
            null
        );


        setIsUserAuthenticated(
            false
        );

    };


    /*
     * =========================================================
     * AUTHENTICATION CONTEXT VALUE
     * =========================================================
     */

    const authenticationContextValue = {

        currentUser,

        isUserAuthenticated,

        loginUser,

        sendOtp,

        loginWithOtp,

        registerUser,

        updateCurrentUser,

        logoutUser,

        isSellerAccount,

        isAdministratorAccount,

        isCustomerAccount,

    };


    /*
     * =========================================================
     * PROVIDER
     * =========================================================
     */

    return (

        <AuthenticationContext.Provider
            value={authenticationContextValue}
        >

            {children}

        </AuthenticationContext.Provider>

    );

}


/*
 * =========================================================
 * CUSTOM AUTHENTICATION HOOK
 * =========================================================
 */

export function useAuthentication() {


    const authenticationContext =
        useContext(
            AuthenticationContext
        );


    if (!authenticationContext) {

        throw new Error(
            "useAuthentication must be used inside AuthenticationContextProvider"
        );

    }


    return authenticationContext;

}