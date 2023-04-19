import { Certificate } from 'pkijs';
import * as asn1js from 'asn1js';
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

async function getCertificateOnCurrentTab(details) {
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
          safe = true;
          //console.log('value-kidsRating: ' + JSON.stringify(kidsRatingValue));
          let kidsRating = kidsRatingValue.parsedValue.valueBlock.value;
          console.log('**kidsRating: ' + kidsRating);
        } else {
          safe = false;

          // warning notifications
          // change symbol

        }
      }
    }

  } catch (error) {
    console.error(error);
    throw error;
  }
};

browser.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (!changeInfo.url) {
    return;
  }
  console.log("***safe? " + safe);
  console.log(changeInfo.url);

  //currentTab = tab;
  console.log('updating icon for tab ' + tabId);
  if (safe) {
    browser.pageAction.setIcon({
      tabId: tabId,
      path: "icons/dyno_icon.png"
    });
    browser.pageAction.setTitle({
      tabId: tabId,
      title: "kidspro Npm"
    });
    browser.notifications.create({
      type: "basic",
      title: "KidsPro alert",
      message: 'Hi you are visiting a website you are supposed to.'
    });
  } else {
    browser.pageAction.setIcon({
      tabId: tabId,
      path: "icons/info_icon.png"
    });
    browser.pageAction.setTitle({
      tabId: tabId,
      title: "kidspro Npm - warning"
    });
    //browser.tabs.sendMessage(tabId, {action: "openWarningDialog"}, function(response) {}); 

    /*browser.notifications.create('above rating', {
      type: "basic",
      title: "KidsPro alert",
      message: 'Hi you are visiting a website you are supposed to.'
    });*/
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

});

browser.webRequest.onHeadersReceived.addListener(
  details => {
    getCertificateOnCurrentTab(details);
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
  if (request.type === 'GREETINGS') {
    const message = `Hi ${sender.tab ? 'Con' : 'Pop'
      }, my name is Bac. I am from Background. It's great to hear from you.`;

    // Log message coming from the `request` parameter
    console.log(request.payload.message);
    // Send a response message
    sendResponse({
      message,
    });
  }
});

function handleClick() {
  browser.runtime.openOptionsPage();
}

browser.browserAction.onClicked.addListener(handleClick);
