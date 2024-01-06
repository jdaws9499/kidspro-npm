//'use strict';

//import './options.css';

let adminPass = '';

const allowedForAll = [
    'https://protectkidsonline.ca',
    'https://www.cybertip.ca'
];

function promptAdminPassword(action) {

    browser.windows.create(
        {
            url: 'prompt.html?action=' + encodeURIComponent(action),
            type: 'popup',
            height: 400,
            width: 600
        }
    );
}

function createAdminPassword() {
    browser.windows.create(
        {
            url: 'createPassword.html',
            type: 'popup',
            height: 400,
            width: 600
        }
    );
}

async function saveOptionsWithPrompt(e) {
    //createAdminPassword();
    promptAdminPassword("saveOptions");
    e.preventDefault();
}

function sendResetCacheMessage(message) {
    chrome.runtime.sendMessage(
        {
            type: 'RESET_CACHE',
            reason: message
        },
        (response) => {
            console.log(response.message);
        }
    );

}

async function saveOptions() {
    console.log('bday typed value: ' + document.querySelector("#bdate").value);
    let birthdate = Date.parse(document.querySelector("#bdate").value);
    console.log('birthdate:' + birthdate);
    // send background to reset caches.
    sendResetCacheMessage('settings update');
    console.log('nickanme' + document.querySelector("#nickname").value);
    browser.storage.sync.set({
        kidsProUser: {
            preference: {
                nickname: document.querySelector("#nickname").value,
                bdate: document.querySelector("#bdate").value,
                rating: getRating(birthdate),
                allowed: {
                    urls: document.querySelector("#allowedUrls").value || "[]"
                },
                blocked: {
                    urls: document.querySelector("#blockedUrls").value || "[]"
                },
                schedules: document.querySelector("#schedules").value || "[]"
            },
            admin: {
                password: document.querySelector("#password").value || ""
            },
            logs: document.querySelector("#logs").value || "[]"
        }
    });
    location.reload();
}

async function resetOptionsWithPrompt(e) {
    promptAdminPassword("resetOptions");
    e.preventDefault();
}

function resetOptions() {
    console.log('reset options');
    browser.storage.sync.set({
        kidsProUser: {
            preference: {
                nickname: "",
                bdate: "",
                rating: "",
                allowed: {
                    urls: "[]"
                },
                blocked: {
                    urls: "[]"
                },
                schedules: "[]"
            },
            admin: {
                password: document.querySelector("#password").value || ""
            },
            logs: document.querySelector("#logs").value || "[]"
        }
    });
    location.reload();
}

function displayAllowedForAll(itemsStr) {
    let items = itemsStr;
    let html = "";
    if (items) {
        for (let i = 0; i < items.length; i++) {
            html += "<li class=\"list-group-item\">"
            html += items[i];
            html += "</li>";
        }
    }
    console.log('display - ' + html);
    document.querySelector("#displayAllowedForAll").innerHTML = html;
}

function displayAllowedItems(itemsStr) {
    console.log('value' + itemsStr);
    console.log('display' + document.querySelector("#displayAllowed").value);

    let items = itemsStr;
    let html = "";
    if (items) {
        for (let i = 0; i < items.length; i++) {
            html += "<tr>"
            html += "<td>" + (i + 1) + "</td>"
            html += "<td>" + items[i] + "</td>";
        }
    }
    console.log('display - ' + html);
    document.querySelector("#displayAllowed").innerHTML = html;
}

function displayBlockedItems(itemsStr) {
    console.log('value' + itemsStr);
    console.log('display' + document.querySelector("#displayBlocked").value);

    let items = itemsStr;
    let html = "";
    if (items) {
        for (let i = 0; i < items.length; i++) {
            //html += "<li class=\"list-group-item\">"
            html += "<tr>"
            html += "<td>" + (i + 1) + "</td>"
            html += "<td>" + items[i] + "</td>";
            //html += "</li>";
        }
    }
    console.log('display - ' + html);
    document.querySelector("#displayBlocked").innerHTML = html;
}

function isSiteAllowed(siteAccess) {
    return (siteAccess === 'A' || siteAccess === 'AW');
}



function getBlockedReason(siteAccess) {
    let reason = 'not known.';
    if (siteAccess === 'B') {
        reason = 'blocked with age rating limit.';
    } else if (siteAccess === 'BB') {
        reason = 'block websites list';
    } else if (siteAccess === 'BBB') {
        reason = 'outside the browse schedule';
    } else if (siteAccess === 'AW') {
        reason = 'allowed with age rating limit.'
    }
    return reason;
}

function displayLogs(logs) {
    console.log('displayLogs - ' + logs);
    let html = "";
    let items = logs;
    if (items) {
        let options = {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: true
        };
        for (let i = 0; i < items.length; i++) {
            let color = "list-group-item-info";
            let siteAccess = items[i].siteAccess;
            if (siteAccess === 'AW') {
                color = "list-group-item-warning";
            } else if (siteAccess === 'BB' || siteAccess === 'B') {
                color = "list-group-item-danger";
            }
            //html += "<ul id=\"displaySchedule\" class=\"list-group list-group-horizontal d-flex " + color + "\">";
            //html += "<li class=\"list-group-item\">";
            //html += new Intl.DateTimeFormat("en-CA", options).format(new Date(items[i].time));
            //html += "</li>";
            let logItem = items[i];
            let isAllowed = isSiteAllowed(logItem.siteAccess);
            if (isAllowed) {
                html += "<tr class=\"table-warning\">";
            } else {
                html += "<tr>";
            }

            html += "<td>" + new Intl.DateTimeFormat("en-CA", options).format(new Date(items[i].time)) + "</td>";
            html += "<td>" + logItem.url.substring(0, 50) + "</td>";
            html += "<td>" + getBlockedReason(logItem.siteAccess) + "</td>";
            html += "<td>";
            //if (items[i].numOfTries && items[i].numOfTries > 1 ) {
            html += logItem.numOfTries;
            //}
            html += "</td>";
            html += "</tr>";
        }
    }
    document.querySelector("#displayLogs").innerHTML = html;
}

function displaySchedules(schedules) {
    console.log('displaySchedules - ') + schedules;
    let html = "";
    let items = schedules; // string to json object
    if (items) {
        for (let i = 0; i < items.length; i++) {
            html += "<tr>";
            html += "<td>" + getDayOfWeek(items[i].dayId) + "</td>";
            html += "<td>" + items[i].from + "</td>";
            html += "<td>" + items[i].to + "</td>";
            //html += "<td><button type=\"button\" id=\"removeSchedule\" class=\"btn btn-secondary btn-sm\"><i class=\"bi bi-x-circle-fill\"></i> Delete</button></td>";
            html += "</tr>";
            /*html += "<ul id=\"displaySchedule\" class=\"list-group list-group-horizontal d-flex\">";
            html += "<li class=\"list-group-item flex-fill\">"
            html += getDayOfWeek(items[i].dayId) + ': ';
            html += "</li>";

            html += "<li class=\"list-group-item\">"
            html += items[i].from + ' - ' + items[i].to;
            html += "</li>";

            html += "</ul>";*/
        }
    }
    document.querySelector("#displaySchedule").innerHTML = html;

}

function getDayOfWeek(dayId) {
    if (dayId) {
        if (dayId === 'day1') {
            return "Monday";
        } else if (dayId === 'day2') {
            return "Tuesday";
        } else if (dayId === 'day3') {
            return "Wednesday";
        } else if (dayId === 'day4') {
            return "Thursday";
        } else if (dayId === 'day5') {
            return "Friday";
        } else if (dayId === 'day6') {
            return "Saturday";
        } else if (dayId === 'day0') {
            return "Sunday";
        }
    } else {
        return 'NA';
    }
}

async function addScheduleWithPrompt(e) {
    promptAdminPassword("addSchedule");
    e.preventDefault();
}

function clearNewScheduleField() {
    document.querySelector("#daySelect").selected = false;

    document.querySelector("#fromTime").value = "";
    document.querySelector("#toTime").value = "";
}

function addCheckedDay(day, fromTime, toTime, days) {
    days.push({ dayId: day, from: fromTime, to: toTime });
    //return days;
}

async function addSchedule() {
    console.log('addSchedule + ' + document.querySelector("#daySelect").value);
    let days = [];
    let fromTime = document.querySelector("#fromTime").value;
    let toTime = document.querySelector("#toTime").value;
    let selectedDay = document.querySelector("#daySelect").value;

    console.log(selectedDay + ': from - ' + fromTime + ' to ' + toTime);

    addCheckedDay(selectedDay, fromTime, toTime, days);
    let schedules = JSON.parse(document.querySelector("#schedules").value || "[]"); // array strings to array object 
    console.log('adding - ' + JSON.stringify(days));
    schedules = schedules.concat(days);
    let sorted = await schedules.sort((a, b) => {
        //1. Check day of the week
        if (a.dayId < b.dayId) {
            return -1;
        } else if (a.dayId > b.dayId) {
            return 1;
        } else {
            //2. from time
            if (a.from < b.from) {
                return -1;
            } else if (a.from > b.from) {
                return 1;
            } else {
                //3. to time
                if (a.to < b.to) {
                    return -1;
                } else if (a.to > b.to) {
                    return 1;
                } else {
                    return 0;
                }
            }
            return 0;
        }
    });

    if (sorted) {
        document.querySelector("#schedules").value = JSON.stringify(sorted);
        console.log('schedules -' + document.querySelector("#schedules").value);
        clearNewScheduleField();
        saveOptions();
    }
}

async function clearSchedulesWithPrompt(e) {
    promptAdminPassword("clearSchedules");
    e.preventDefault();
}

async function clearSchedules() {
    console.log('clearSchedules');
    document.querySelector("#schedules").value = "[]";
    saveOptions();
}

async function clearLogsWithPrompt(e) {
    promptAdminPassword("clearLogs");
    e.preventDefault();
}

async function clearLogs() {
    console.log('clearLogs');
    document.querySelector("#logs").value = "[]";
    saveOptions();
}



async function addAllowItemWithPrompt(e) {
    promptAdminPassword("addAllowItem");
    e.preventDefault();
}

function addAllowItem() {
    console.log('addAllowItem');
    let newItem = document.querySelector("#newAllowItem").value;
    let urls = JSON.parse(document.querySelector("#allowedUrls").value || "[]");
    urls.push(newItem);
    //document.querySelector("output[name='allowedUrls']").value = JSON.stringify(urls);
    document.querySelector("#allowedUrls").value = JSON.stringify(urls);
    document.querySelector("#newAllowItem").value = "";
    //displayAllowedItems(JSON.stringify(urls));
    saveOptions();
}

async function clearAllowItemsWithPrompt(e) {
    promptAdminPassword("clearAllowItems");
    e.preventDefault();
}

async function clearAllowItems() {
    console.log('clearAllowItems');
    document.querySelector("#allowedUrls").value = "[]";
    saveOptions();
}

async function addBlockItemWithPrompt(e) {
    promptAdminPassword("addBlockItem");
    e.preventDefault();
}

function addBlockItem() {
    console.log('addBlockItem');
    let newItem = document.querySelector("#newBlockItem").value;
    let urls = JSON.parse(document.querySelector("#blockedUrls").value || "[]");
    urls.push(newItem);
    //displayBlockedItems(JSON.stringify(urls));
    document.querySelector("#blockedUrls").value = JSON.stringify(urls);
    document.querySelector("#newBlockItem").value = "";
    saveOptions();
}

async function clearBlockItemsWithPrompt(e) {
    promptAdminPassword("clearBlockItems");
    e.preventDefault();
}

async function clearBlockItems() {
    console.log('clearBlockItems');
    document.querySelector("#blockedUrls").value = "[]";
    saveOptions();
}


function getRating(birthday) {
    let age = calculateAge(birthday);
    console.log('age: ' + age);
    let rating = 'NA';
    if (age > -1) {
        if (age <= 5) {
            rating = 'P';
        } else if (age <= 9) {
            rating = 'E';
        } else if (age <= 12) {
            rating = 'T';
        } else if (age <= 15) {
            rating = 'ET';
        } else if (age <= 17) {
            rating = 'MT';
        }
        console.log('rating: ' + rating);
        return rating;
    } else {
        return 'NA';
        //throw new Error('cannot get rating from birthday - ' + birthday);
    }
}

function calculateAge(birthday) { // birthday is a date
    if (birthday) {
        var ageDifMs = Date.now() - birthday;
        var ageDate = new Date(ageDifMs); // miliseconds from epoch
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    } else {
        return -1;
    }
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

function adminLogout() {
    console.log('adminLogout');
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
            console.log('data ' + JSON.stringify(res.kidsProUser));
            document.querySelector("#nickname").value = res.kidsProUser.preference.nickname || 'Not Set';
            document.querySelector("#bdate").value = res.kidsProUser.preference.bdate || getMinimumDate;
            document.querySelector("output[name='rating']").value = res.kidsProUser.preference.rating || 'NA';
            if (res.kidsProUser.preference.blocked) {
                document.querySelector("output[name='blockedUrls']").value = res.kidsProUser.preference.blocked.urls;
                displayBlockedItems(JSON.parse(res.kidsProUser.preference.blocked.urls));
            }
            if (res.kidsProUser.preference.allowed) {
                document.querySelector("output[name='allowedUrls']").value = res.kidsProUser.preference.allowed.urls;
                displayAllowedItems(JSON.parse(res.kidsProUser.preference.allowed.urls));
            }
            //displayAllowedForAll(allowedForAll);
            if (res.kidsProUser.preference.schedules) {
                document.querySelector("output[name='schedules']").value = res.kidsProUser.preference.schedules;
                displaySchedules(JSON.parse(res.kidsProUser.preference.schedules));
            }

            document.querySelector("output[name='password'").value = res.kidsProUser.admin.password;

            if (res.kidsProUser.logs) {
                document.querySelector("output[name='logs']").value = res.kidsProUser.logs;
                displayLogs(JSON.parse(res.kidsProUser.logs));
            }
        });

    } catch (error) {
        console.error(error);
    }
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('options.js received a message- ' + JSON.stringify(request));

    if (request.type === 'action') {
        if (request.message === 'saveOptions') {
            saveOptions();
        } else if (request.message === 'resetOptions') {
            resetOptions();
        } else if (request.message === 'addAllowItem') {
            addAllowItem();
        } else if (request.message === 'addBlockItem') {
            addBlockItem();
        } else if (request.message === 'addSchedule') {
            addSchedule();
        } else if (request.message === 'clearSchedules') {
            clearSchedules();
        } else if (request.message === 'clearAllowItems') {
            clearAllowItems();
        } else if (request.message === 'clearBlockItems') {
            clearBlockItems();
        } else if (request.message === 'clearLogs') {
            clearLogs();
        } else if (request.message === 'restoreOptions') {
            restoreOptions();
        }
    }
});

document.addEventListener('DOMContentLoaded', restoreOptions);
window.addEventListener("beforeunload", adminLogout);
//document.querySelector("#save").addEventListener("click", saveOptionsWithPrompt);
//document.querySelector("#reset").addEventListener("click", resetOptionsWithPrompt);
document.querySelector("#save").addEventListener("click", saveOptions);
document.querySelector("#reset").addEventListener("click", resetOptions);
//document.querySelector("#addAllow").addEventListener("click", addAllowItemWithPrompt);
//document.querySelector("#addBlock").addEventListener("click", addBlockItemWithPrompt);
document.querySelector("#addAllow").addEventListener("click", addAllowItem);
document.querySelector("#addBlock").addEventListener("click", addBlockItem);
//document.querySelector("#clearAllowItems").addEventListener("click", clearAllowItemsWithPrompt);
//document.querySelector("#clearBlockItems").addEventListener("click", clearBlockItemsWithPrompt);
document.querySelector("#clearAllowItems").addEventListener("click", clearAllowItems);
document.querySelector("#clearBlockItems").addEventListener("click", clearBlockItems);
//document.querySelector("#addSchedule").addEventListener("click", addScheduleWithPrompt);
//document.querySelector("#clearSchedules").addEventListener("click", clearSchedulesWithPrompt);
document.querySelector("#addSchedule").addEventListener("click", addSchedule);
document.querySelector("#clearSchedules").addEventListener("click", clearSchedules);
document.querySelector("#clearLogItems").addEventListener("click", clearLogs);
//document.querySelector("#clearLogItems").addEventListener("click", clearLogsWithPrompt);




