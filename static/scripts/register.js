"use strict";
(function () {
    const BASE_URL = "http://localhost:8080";

    window.addEventListener('load', init);

    function init() {
        id('register').addEventListener('click', register);
   
    }

    function register() {
        const url = BASE_URL + "/register";
    
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
                id('message').textContent = data['message'];
                if (data.message === "Account has been created successfully.") {
                    console.log("Registration successful");
                    id('status').textContent = "Now you can login";
                } else {
                    console.log("Registration failed or message is different");
                }
            })
            .catch((error) => console.error("Error:", error));
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
