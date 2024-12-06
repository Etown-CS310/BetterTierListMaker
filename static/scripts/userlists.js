"use strict";
(function(){
    window.addEventListener('load', init);

    function init(){
        getLists();
    }

    function getLists(){
        let base_url = "http://localhost:8080/userpage/";
        let user = window.sessionStorage.getItem("username");
        let url = base_url + user;
        fetch(url)
        .then(checkStatus)
        .then(postLists)
        .catch((e)=>{console.log(e);});
    }

    function postLists(listJson){
        console.log(listJson);
        if (!listJson || (Array.isArray(listJson) && listJson.length === 0)) {
            document.querySelector('.listarea').innerHTML = 'No lists available.';
            return;
        }
        listJson.forEach((list) => {
            let box = document.createElement('div');
            box.classList.add('flexbox');
            let thumbnail = document.createElement('img');
            thumbnail.src = list.thumbnail;
            box.appendChild(thumbnail);
            fetch("http://localhost:8080/get-json/" + list.data)
            .then(checkStatus)
            //.then((response) => {response.json()})
            .then((data) => {
                let link = document.createElement('a');
                link.textContent = data.title;
                link.href = "/editor.html"; //make it call the import function as well.
                box.appendChild(link);
                document.querySelector('.listarea').appendChild(box);
            })
            .catch((e)=>{console.log(e)});
        });
            
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
})()