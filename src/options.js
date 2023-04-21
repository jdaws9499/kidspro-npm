//'use strict';

import './options.css';

function saveOptions(e) {
    console.log('bday typed value: ' + document.querySelector("#bdate").value);
    let birthdate = Date.parse(document.querySelector("#bdate").value);
    console.log('birthdate:' + birthdate);

    browser.storage.sync.set({
        //nickname: document.querySelector("#nickname").value,
        //bdate: document.querySelector("#bdate").value,
        //rating: getRating(birthdate)
        kidsProUser: {
            nickname: document.querySelector("#nickname").value,
            bdate: document.querySelector("#bdate").value,
            rating: getRating(birthdate),
            allowed: {
                //urls: "[]"
                urls: document.querySelector("#allowedUrls").value || "[]"
            }
        },
        /*blockedUrls: {
            blockedUrls: document.querySelector("#blockedUrls").value
        },*/

    });

    e.preventDefault();
}

function displayAllowedItems(itemsStr) {
    document.querySelector("output[name='allowedUrls']").value = itemsStr;
    //document.querySelector("output[name='displayAllowed']").value = itemsStr;
    console.log('value' + itemsStr);
    console.log('display' + document.querySelector("#displayAllowed").value);

    let items = JSON.parse(itemsStr);
    let html = "";
    if (items) {
        for (let i = 0; i < items.length; i++) {
            html += "<input type=\"disabled\" value = " + items[i] + " id=\"allowed_" + i + "\" name=\"allowed_" + i +"\">"
            html += "</input>";
            /*<input type="button" id="addAllow" value="addAllow"/>*/

            html += "<input type=\"button\" id=\"deleteAllow_" + i + " name=\"deleteAllow_" + i + "\ value=\"Delete\"></input></br>";

        }
    }
    console.log('display - ' + html);
    document.querySelector("#displayAllowed").innerHTML = html;
    //document.pref.elements("allowedUrls").value = items;
    /*if (items) {
        for (let i = 0; i < items.length; i++) {
            document.querySelector("#deleteAllow_" + i ).addEventListener("click", deleteAllowItem(i));
        }
    }*/
}

function deleteAllowItem(i) {
    console.log("deleteAllowItem");
    let urls = JSON.parse(document.querySelector("#allowedUrls").value);
    urls.splice(i, 1);
    displayAllowedItems(JSON.stringify(urls));
    //saveOptions(e);
}


function addAllowItem(e) {
    //let allowedUrlData = browser.storage.sync.get('allowedUrlData');
    console.log('addAllowItem');
    let newItem = document.querySelector("#newAllowItem").value;
    /*let allowedItems = [];
    allowedUrlData.then((res) => {
        allowedItems = res.urls;
        allowedItems.push(newItem);
    });*/
    //let allowedUrls = document.querySelector("#allowedUrls").value;
    //let allowedUrlsElement = document.getElementById("allowedUrls");
    let urls = JSON.parse(document.querySelector("#allowedUrls").value);
    urls.push(newItem);
    document.querySelector("#newAllowItem").value = "";
    displayAllowedItems(JSON.stringify(urls));

    saveOptions(e);
}

function getRating(birthday) {
    let age = calculateAge(birthday);
    console.log('age: ' + age);
    let rating = 'NA';
    if (age) {
        if (age <= 5) {
            rating = 'P';
        } else if (age <= 9) {
            rating = 'E';
        } else if (age <= 12) {
            rating = 'T';
        } else if (age <= 15) {
            rating = 'ET';
        } else if (age <= 17) {
            rating = 'LT';
        }
        console.log('rating: ' + rating);
        return rating;
    } else {
        throw new Error('cannot get rating from birthday - ' + birthday);
    }
}

function calculateAge(birthday) { // birthday is a date
    var ageDifMs = Date.now() - birthday;
    var ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function getMinimumDate() {
    let minDate = new Date();
    let day = minDate.getDate();
    let month = minDate.getMonth();
    if (month < 10) {
        month = '0' + month;
    }
    let year = minDate.getFullYear() - 18;
    minDate = year + '-' + month + '-' + day
    console.log('17 yr old birthdate: ' + minDate)
    return minDate;
}

function restoreOptions() {
    try {
        console.log('restoreOptions');
        //let storage = browser.storage.managed;
        let storageItem = browser.storage.managed.get('kidsProUser');
        storageItem.then((res) => {
            document.querySelector("#managed-bdate").innerText = res.kidsProUser.bdate;
        });

        let userData = browser.storage.sync.get('kidsProUser');
        userData.then((res) => {
            document.querySelector("#nickname").value = res.kidsProUser.nickname || 'Not Set';
            document.querySelector("#bdate").value = res.kidsProUser.bdate || getMinimumDate;
            document.querySelector("#rating").value = res.kidsProUser.rating || 'Not Set';
            displayAllowedItems(res.kidsProUser.allowed.urls);
        });

    } catch (error) {
        console.error(error);
    }

}
document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
document.querySelector("#addAllow").addEventListener("click", addAllowItem);
