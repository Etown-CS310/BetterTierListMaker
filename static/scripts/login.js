"use strict";
(function () {
    const BASE_URL = "http://localhost:8080";

    window.addEventListener('load', initalize);

    function initalize() {
        id('login-btn').addEventListener('click', loginFunction);  // Set up event listener for login
    }

    function loginFunction() {
        const url = BASE_URL + "/login";
        console.log("error");

        // Prepare the data from the input fields
        const data = {
            username: id("username").value,
            password: id("password").value
        };

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        };

        fetch(url, options)
            .then(checkStatus)
            .then((data) => {
                // If login is successful
                if (data.message === "Login successful") {
                    console.log("Login successful");
                    id('message').textContent = data.message;
                    
                    
                    // Store username in session storage and redirect
                    window.sessionStorage.setItem('username', data.username);
                    location.assign('/user');  // Redirect to /user page
                } else {
                    id('message').textContent = data.message || "Login failed. Please try again.";
                }
            })
            .catch((error) => {
                console.error("Error:", error);
                id('message').textContent = "An error occurred. Please try again later.";
            });
    }

    /**
     * Helper function to get an element by ID.
     * @param {string} idName - element ID
     * @returns {HTMLElement|null} DOM element if found, otherwise null.
     */
    function id(idName) {
        return document.getElementById(idName);
    }

    function qs(idName) {
        return document.querySelector(idName);
    }

    /**
     * Enhanced checkStatus to throw error on non-OK response.
     * @param {Response} response - fetch response object
     * @returns {Promise} parsed JSON response if successful
     * @throws {Error} on any HTTP error
     */
    function checkStatus(response) {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(`Error ${response.status}: ${err.message || response.statusText}`);
            });
        }
        return response.json();
    }
})();
