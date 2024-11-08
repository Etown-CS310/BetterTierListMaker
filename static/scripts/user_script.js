"use strict";

(function () {

    window.addEventListener("load", init);

    function init() {
    
        const username = window.sessionStorage.getItem('username');

        if (username) {
            id('username').textContent = username;
        }

    }

    /*************** Helper Functions ****************/
    /**
     * Helper function to get element by id
     * @param {id} id 
     * @returns the element with the given id
     */
    function id(id) {
        return document.getElementById(id);
    }

})();
