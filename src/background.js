import { Certificate } from 'pkijs';
import * as asn1js from 'asn1js';
const NodeCache = require("node-cache");
const ratingCache = new NodeCache();
//'use strict';

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

/**
 * @param {*} extensions 
 * @param {*} id 
 * @returns 
 */
function getX509Ext(extensions, id) {
  for (var extension in extensions) {
    if (extensions[extension].extnID === id) {
      return extensions[extension];
    }
  }
}

let safe = true;
let block = false;
const ratings = [
  'P', // 0-5
  'E', // 6-9
  'T', // 10-12
  'ET', // 13-15
  'LT']; // 16-17

const accessLevel = [
  'A', // Allow
  'W', // Allowed with warning
  'B',  // Block, blocked because of the age
  'BB', // Blocked from list
  'AA', // Allowed from list 
]

async function validateSite(details) {
  const preference = getPreference();
  const siteRating = await getCertificateRating(details);

  //console.log('preference: ' + preference);
  let ratingMatched = true;
  let allowed = false;
  let blocked = false;
  let siteUrl = new URL(details.url);
  //let siteUrl = details.url.replace(/\/$/, "");
  console.log('siteUrl origin - ' + siteUrl.origin);
  let siteAccess = 'A';
  if (siteRating) {
    console.log('**siteRating: ' + siteRating);
    if (preference.rating && ratings.indexOf(preference.rating) > -1) {
      ratingMatched = ratings.indexOf(siteRating) > -1 && (ratings.indexOf(siteRating) <= ratings.indexOf(preference.rating));
      if (!ratingMatched) {
        if (preference.rating === 'P' || preference.rating === 'E') {
          siteAccess = 'B';
        } else {
          siteAccess = 'W';
        }
      }
    }

    if (preference.allowedUrls) {
      allowed = preference.allowedUrls.indexOf(siteUrl.origin) > -1;
      if (allowed) {
        siteAccess = 'AA';
      }
    }

    if (preference.blockedUrls) {
      blocked = preference.blockedUrls.indexOf(siteUrl.origin) > -1;
      if (blocked) {
        siteAccess = 'BB';
      }
    }

    console.log('siteAccess - ' + siteAccess);
    ratingCache.set(siteUrl.origin, siteAccess, 10000);

    const currentTab = await browser.tabs.getCurrent();
    //let currentTab = await getCurrentTab();
    if (currentTab) {
      console.log("currentTab Id" + JSON.stringify(currentTab));
    }
    /*browser.runtime.sendMessage("handleSiteAccess", {
      url: siteUrl,
      siteAccess: siteAccess,
      urlRating: siteRating,
    });*/
  }
}

//browser.runtime.onMessage.addListener(handleSiteAccess)

async function getCertificateRating(details) {
  try {
    console.log('newcert - ' + JSON.stringify(details));
    let securityInfo = await browser.webRequest.getSecurityInfo(
      details.requestId,
      { "certificateChain": true, rawDER: true }
    );
    if (securityInfo) {
      let cert = securityInfo.certificates[0];
      console.log('certificate - ' + JSON.stringify(cert));
      let certificateChain = new Uint8Array(cert.rawDER).buffer;
      let asn1 = asn1js.fromBER(certificateChain);

      let x509 = await new Certificate({ schema: asn1.result });
      if (x509) {
        x509 = x509.toJSON();
        //console.log('x509 in pkijs - ' + x509);
        console.log('extensions - ' + JSON.stringify(x509.extensions));
        let san = getX509Ext(x509.extensions, '2.5.29.17').parsedValue;
        if (san && san.hasOwnProperty('altNames')) {
          console.log('*Subject Alt Names: ' + JSON.stringify(san));
        }
        let kidsRatingValue = getX509Ext(x509.extensions, "1.2.3.4");
        if (kidsRatingValue) {
          return kidsRatingValue.parsedValue.valueBlock.value;
        } else {
          return "NA";
        }
      }
    }

  } catch (error) {
    console.error(error);
    throw error;
  }
};

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

function getPreference() {
  let preference = ratingCache.get('preference');
  if (!preference) {
    preference = parsePreference();
  }
  console.log('pref:' + JSON.stringify(preference));
  return preference;
}

async function getAdminPassword() {
  let userData = await browser.storage.sync.get('kidsProUser');
  let pass = '';
  if (userData) {
    pass = userData.kidsProUser.adminPass;
  }
  return pass;
}

async function parsePreference() {
  let userData = await browser.storage.sync.get('kidsProUser');
  let pref = {};
  if (userData) {
    pref.rating = userData.kidsProUser.rating;
    pref.allowedUrls = userData.kidsProUser.allowed.urls;
    pref.blockedUrls = userData.kidsProUser.blocked.urls;
  }

  console.log('parsed preference');
  ratingCache.set('preference', pref);
  return pref;
}

function redirect(tabId, url, siteRating) {
  //console.log(`Redirecting: ${requestDetails.url}`);
  const redirectUrl = browser.runtime.getURL('blocked.html') + '?url=' + encodeURIComponent(url) + '?access=' + encodeURIComponent(siteRating);
  /*if (requestDetails.url === targetUrl) {
    return;
  }*/

  chrome.tabs.update(tabId, {
    url: redirectUrl
  });
}

browser.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (!changeInfo.url || changeInfo.url.startsWith("moz-extension:")) { // redirecting
    return;
  }

  const originUrl = new URL(changeInfo.url).origin;
  console.log('changeInfo.url.origin: ' + originUrl);

  let siteAccess = ratingCache.get(originUrl);
  if (siteAccess) {
    console.log('found siteAccess: ' + siteAccess);

    //TODO cache site rating also
    if (siteAccess === 'A' || siteAccess === 'AA') {
      browser.pageAction.setIcon({
        tabId: tabId,
        path: "icons/dyno_icon.png"
      });
      browser.pageAction.setTitle({
        tabId: tabId,
        title: "kidspro Npm"
      });
    }

    if (siteAccess === 'W') {
      browser.notifications.create({
        type: "basic",
        title: "KidsPro alert",
        message: 'Hi you are visiting a website you are not supposed to.'
      });
      browser.pageAction.setIcon({
        tabId: tabId,
        path: "icons/info_icon.png"
      });
      browser.pageAction.setTitle({
        tabId: tabId,
        title: "kidspro Npm - warning"
      });
    }

    if (siteAccess === 'B' || siteAccess === 'BB') {
      redirect(tabId, changeInfo.url, siteAccess);
    }
  }
});

browser.runtime.onInstalled.addListener(() => {
  // tracking badge text ON or OFF
  console.log('new install');
  /*browser.pageAction.setBadgeText({
      text: "SAFE",
  });*/
  browser.notifications.create('above rating', {
    type: "basic",
    title: "KidsPro alert",
    message: 'Hi you are visiting a website you are supposed to.'
  });

  parsePreference();

});

browser.webRequest.onHeadersReceived.addListener(
  details => {
    validateSite(details);
  },
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["blocking"]
);

browser.webRequest.onErrorOccurred.addListener(
  details => {
    // eventually we will be able to consume these details, but for now we can only
    // disable the icon
    // consume(details);
    if (details.type === 'main_frame' && details.documentUrl === undefined) {
      console.log('error happend' + JSON.stringify(details));
      //icon.update(details.tabId, 'http');
    }
  },
  { urls: ['<all_urls>'] }
);

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('backgrounds.js received a message- ' + JSON.stringify(request));
  if (request.type === 'GREETINGS') {
    const message = `Hi ${sender.tab ? 'Con' : 'Pop'
      }, my name is Bac. I am from Background. It's great to hear from you.`;

    // Log message coming from the `request` parameter
    console.log(request.payload.message);
    // Send a response message
    sendResponse({
      message,
    });
    return true;
  } else if (request.type === 'verifyPassword') {
    const getP = getAdminPassword();
    getP.then( function(password) {
      if (password === request.password) {
        // ok.
        console.log('match!');
        sendResponse({message: "success"});
      } else {
        console.log('fail!');
        sendResponse({message: "fail"});
      }
    });
    return true;
  }
});

function handleClick() {
  browser.runtime.openOptionsPage();
}

FUNCTION
browser.browserAction.onClicked.addListener(handleClick);