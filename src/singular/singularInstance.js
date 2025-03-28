import ApiManager from "../api/apiManager";
import BannerManager from "../banners/bannerManager"
import Utils from "../utils/utils";
import SingularState from "./singularState";
import SingularLog from "./singularLog";
import PageVisitApi from "../api/pageVisitApi";
import { Params, SDK } from '../consts/constants';
import { v4 as uuidv4 } from 'uuid';


export default class SingularInstance {

    constructor(config) {
        this._singularState = SingularState.getInstance().init(config);

        if (!Utils.isNullOrEmpty(config.customUserId)) {
            this._singularState.setCustomUserId(config.customUserId);
        }

        SingularLog.info(`SDK is initialized Apikey:${config.apikey}, Product Id:${config.productId}`);

        this._apiManager = new ApiManager();
        this.sendApi(new PageVisitApi());
        this._bannerManager = new BannerManager();
    }

    sendApi(api) {
        this._apiManager.sendApi(api);
    }

    setCustomUserId(customUserId) {
        this._singularState.setCustomUserId(customUserId);
    }

    unsetCustomUserId() {
        this._singularState.unsetCustomUserId();
    }

    openApp(baseLink, deeplink, passthrough, deferredDeeplink) {
        const webToAppLink = this.buildWebToAppLink(baseLink, deeplink, passthrough, deferredDeeplink);

        if (!webToAppLink) {
            return;
        }

        window.open(webToAppLink);
    }

    openAppWithClipboardDdl(baseLink, deeplink, passthrough, deferredDeeplink) {
        const webToAppLink = enrichUrlWithClipboardDdlFlow(this.buildWebToAppLink(baseLink, deeplink, passthrough, deferredDeeplink));

        if (!webToAppLink) {
            return;
        }

        window.open(webToAppLink);
    }

    buildWebToAppLink(baseLink, deeplink, passthrough, deferredDeeplink) {
        const webToAppLink = Utils.buildWebToAppLink(baseLink, this._singularState.getWebUrl(), deeplink, passthrough, deferredDeeplink);

        if (!webToAppLink) {
            SingularLog.warn("Invalid base link when generating web to app link");
        }

        return webToAppLink;
    }

    getSingularDeviceId() {
        return this._singularState.getSingularDeviceId();
    }

    getMatchID() {
        return this._singularState.getMatchID() || this._singularState.getSingularDeviceId();
    }

    setMatchID(matchId) {
        this._singularState.setMatchID(matchId);
    }

    clearMatchID() {
        this._singularState.clearMatchID();
    }

    getGlobalProperties() {
        return this._singularState.getGlobalProperties();
    }

    clearGlobalProperties(){
        return this._singularState.clearGlobalProperties();
    }

    setGlobalProperties(key, value) {
        this._singularState.setGlobalProperties(key, value);
    }

    isSameApp(config) {
        return this._singularState.getSingularConfig().isSameApp(config);
    }

    updateSingularConfig(config) {
        this._singularState.updateSingularConfig(config);
    }

    deselectCurrent(){
        var selection = document.getSelection();
        if (!selection.rangeCount) {
          return function () {};
        }
        var active = document.activeElement;
      
        var ranges = [];
        for (var i = 0; i < selection.rangeCount; i++) {
          ranges.push(selection.getRangeAt(i));
        }
      
        switch (active.tagName.toUpperCase()) { // .toUpperCase handles XHTML
          case 'INPUT':
          case 'TEXTAREA':
            active.blur();
            break;
      
          default:
            active = null;
            break;
        }
      
        selection.removeAllRanges();
        return function () {
          selection.type === 'Caret' &&
          selection.removeAllRanges();
      
          if (!selection.rangeCount) {
            ranges.forEach(function(range) {
              selection.addRange(range);
            });
          }
      
          active &&
          active.focus();
        };
    }

    copyToClipboard(text) {
        var reselectPrevious, range, selection, mark;
        reselectPrevious = this.deselectCurrent();
        range = document.createRange();
        selection = document.getSelection();
        mark = document.createElement("span");
        mark.textContent = text;
        mark.style.all = "unset";
        mark.style.position = "fixed";
        mark.style.top = 0;
        mark.style.clip = "rect(0, 0, 0, 0)";
        mark.style.whiteSpace = "pre";
        mark.style.webkitUserSelect = "text";
        mark.style.MozUserSelect = "text";
        mark.style.msUserSelect = "text";
        mark.style.userSelect = "text";
        document.body.appendChild(mark);
        range.selectNodeContents(mark);
        selection.addRange(range);
        document.execCommand("copy");
        if (typeof selection.removeRange == "function") {
            selection.removeRange(range);
        } else {
            selection.removeAllRanges();
        }
        document.body.removeChild(mark);
        reselectPrevious();
    }

 
    enrichUrlWithClipboardDdlFlow(url) {
        const uuid = uuidv4(); 
        const currentUrl = window.location.href;
        const urlObj = new URL(currentUrl);
        const appendedUrl = urlObj.protocol + '//' + urlObj.hostname + '/' +SDK.ECID_PREFIX + '/' + uuid;
        const redirectUrlObj = new URL(url);
        redirectUrlObj.searchParams.append(Params.ECID, appendedUrl);  
        this.copyToClipboard(appendedUrl);
        return redirectUrlObj.toString();
    }

    enrichUrlWithMarketingData(url) {
        if (!this._singularState._isWebUrlContainingMarketingData(window.location.href)) {
            return url;
        }

        let locationQueryObject = Utils.parseQueryFromUrl(window.location.href);
        let urlQueryObject = Utils.parseQueryFromUrl(url);

        let locationQueryKeys = Object.keys(locationQueryObject);
        let urlQueryKeys = Object.keys(urlQueryObject);

        // Filter the keys to check if keys available to be added in url
        let keysToAdd = locationQueryKeys.filter(function(v) {
            return urlQueryKeys.indexOf(v)==-1;
        })

        // Filter the keys to check if keys to be added are marketing params or not
        let marketingParams = Utils.extractMarketingData(keysToAdd);

        /* if url has other parameters added , append utm parameters to url
           if url has '#', then append params before '#' in url
           if url has no parameters added , add utm parameters to url */

        for (const [i, key] of marketingParams.entries()) {
            let queryParam = `${encodeURIComponent(key)}=${encodeURIComponent(locationQueryObject[key])}`; 

            url = (url.indexOf("?") != -1 ? Utils.appendQueryParamsToUrl('?',queryParam,url)
              : (url.indexOf("#") != -1 ? Utils.appendQueryParamsToUrl('#',queryParam,url)
                : (`${url}${"?"}${queryParam}`)));
        }
        return url;
    }

    showBanner(linkParams) {
        this._bannerManager.showBanner(linkParams);
    }

    hideBanner() {
        this._bannerManager.hideBanner();
    }

    fetchBanner() {
        this._bannerManager.fetchBanner();
    }
}
