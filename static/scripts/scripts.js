"use strict";
(function () {
    const BASE_URL = "http://localhost:8080";

    window.addEventListener('load', init);

    function init() {
        id('register').addEventListener('click', register);
        id('login').addEventListener('click', login);
    }

    function register() {
      
        const url = BASE_URL + "/register";

        let formData = new FormData();

        formData.append("username", id("username").value);
        formData.append("password", id("password").value);

        const options = {
            method: "POST",
            body: formData
        };

        fetch(url, options)
            .then(checkStatus)
            .then((data) => {
                id('message').textContent = data['message'];
            });

    }

    function login() {
       
        const url = BASE_URL + "/login";

        let formData = new FormData();

        formData.append("username", id("username").value);
        formData.append("password", id("password").value);

        const options = {
            method: "POST",
            body: formData
        };

        fetch(url, options)
            .then(checkStatus)
            .then((data) => {
                if (data['message'] === "Login successful") {
                    id('message').textContent = data['message'];

                    // TODO: (part 3) - redirect to /user after login
                    // uncomment the following two lines after you have completed Part 2b
                    window.sessionStorage.setItem('username', username);
                    location.assign('/user');
                }
            });

    }
})();


/* ------------------------------ Helper Functions  ------------------------------ */

/**
 * Returns the element that has the ID attribute with the specified value.
 * @param {string} id - element ID
 * @returns {object} DOM object associated with id.
 */
function id(idName) {
    return document.getElementById(idName);
}

/**
 * Returns the first element that matches the given CSS selector.
 * @param {string} query - CSS query selector.
 * @returns {object} The first DOM object matching the query.
 */
function qs(query) {
    return document.querySelector(query);
}

/**
 * Returns the array of elements that match the given CSS selector.
 * @param {string} query - CSS query selector
 * @returns {object[]} array of DOM objects matching the query.
 */
function qsa(query) {
    return document.querySelectorAll(query);
}

/**
 * This function needs documentation.
 * @returns {} response
 */
function checkStatus(response) {
    if (!response.ok) {
        console.log("Error in request: " + response.statusText);
    }
    return response.json();
}
