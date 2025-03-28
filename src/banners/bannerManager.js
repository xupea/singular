import BannerApi from "../api/bannerApi";
import { Params, Request } from "../consts/constants";
import SingularState from "../singular/singularState";
import Singular from "../singular/singular";
import {Storage} from "../consts/constants";
import Utils from "../utils/utils";
import SingularLog from "../singular/singularLog";

const CLASS_PREFIX = "singular-banner-";
const BANNER_SOURCE = "Organic Banner";

export default class BannerManager {
    constructor() {
        this.isShowingBanner = false;
        this.bannersAPI = new BannerApi();

        this.bannerElement = this.htmlToElement(this.fetchTemplate());
        this.bannerStyle = null;

        this.closeButton = this.bannerElement.getElementsByClassName('singular-banner-close-button')[0];
        this.downloadButton = this.bannerElement.getElementsByClassName('singular-banner-download-button')[0];

        // We need these to remove event listeners
        this.onCloseClick;
        this.onDownloadClick;
        this.urlChangeInterval;
    }

    // TODO: The template should be a static resource 
    fetchTemplate() {
        return `<div id="singular-banner">
        <img class="singular-banner-background-image">
        <img class="singular-banner-logo">
        <div class="singular-banner-content">
          <span class="singular-banner-title"></span>
          <span class="singular-banner-subtitle"></span>
        </div>
        <svg class="singular-banner-close-button" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 13 13" xml:space="preserve"><g><g><path id="icon_remove" d="M7.6,6.1l4.4,4.4c0.4,0.4,0.4,1,0,1.4s-1,0.4-1.4,0L6.1,7.6L1.7,12c-0.4,0.4-1,0.4-1.4,0
            c-0.4-0.4-0.4-1,0-1.4l4.4-4.4L0.3,1.7c-0.4-0.4-0.4-1,0-1.4s1-0.4,1.4,0l4.4,4.4l4.4-4.4c0.4-0.4,1-0.4,1.4,0s0.4,1,0,1.4
            L7.6,6.1z"></path></g></g></svg>
        <div class="singular-banner-download-button"></div>
      </div>`;
    }

    fetchBanner() {
        return this.bannersAPI.sendRequest(this.getBannerLastDismissed());
    }

    async showBanner(linkParamOverride) {
        if (this.isShowingBanner) {
            return;
        }

        this.isShowingBanner = true;

        const banner = await this.fetchBanner();
        if (!banner) {
            return;
        }

        this.renderBanner(banner, linkParamOverride);
        this.sendImpression(banner);
    }

    hideBanner() {
        this.isShowingBanner = false;

        this.closeButton.removeEventListener('click', this.onCloseClick);
        this.downloadButton.removeEventListener('click', this.onDownloadClick);
        this.removeUrlChangeListener();

        this.bannerElement.remove();
        this.bannerStyle.remove();
    }

    isValidUrl(string) {
        try {
            let url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    setBannerStyle(css, onLoad) {
        if (this.isValidUrl(css)) {
            this.bannerStyle = document.createElement('link');
            this.bannerStyle.href = css;
            this.bannerStyle.type = 'text/css';
            this.bannerStyle.rel = 'stylesheet';
        } else {
            this.bannerStyle = document.createElement('style');
            this.bannerStyle.innerHTML = css;
        }

        this.bannerStyle.onload = onLoad;
        document.head.appendChild(this.bannerStyle);
    }

    renderBanner(banner, linkParamOverride) {
        const { display: { placement, css, ...elementValues }, meta } = banner;

        const addBannerElement = () => document.body.prepend(this.bannerElement);

        Object.entries(elementValues).forEach(([key, value]) => {
            const formattedKey = this.getElementClassName(key);
            const element = this.bannerElement.getElementsByClassName(formattedKey)[0];
            if (!element) {
                return;
            }

            if (element.nodeName === "IMG") {
                element.src = value;
            } else if (element.nodeName === "DIV" || element.nodeName === "SPAN") {
                element.innerHTML = value.toString();
            }
        });

        if (placement) {
            this.bannerElement.classList.add(placement);
        }

        this.onCloseClick = () => {
            this.setBannerLastDismissed()
            this.hideBanner();
        };

        this.onDownloadClick = () => {
            const redirectUrl = this.prepareLink(linkParamOverride, meta);
            window.open(redirectUrl);
        };

        this.closeButton.addEventListener("click", this.onCloseClick);
        this.downloadButton.addEventListener("click", this.onDownloadClick);
        this.addUrlChangeListener();

        // We want to load the banner element only after the loading of the banner css completes.
        this.setBannerStyle(css, addBannerElement);
    }

    async sendImpression(banner) {
        const { meta } = banner;
        const { impression_link } = meta;

        if (!impression_link) {
            return;
        }

        const enrichedLink = this.enrichLinkData(impression_link, meta);

        try {
            await fetch(enrichedLink, { mode: 'no-cors' });
        } catch(e) {
            SingularLog.debug(`failed to send banner impression ${enrichedLink}, error: ${e}`);
        }
    }

    getElementClassName(fieldName) {
        return `${CLASS_PREFIX}${fieldName.replace('_', '-')}`;
    }

    htmlToElement(html) {
        const template = document.createElement('div');
        template.innerHTML = html.trim();
        return template.firstChild;
    }

    prepareLink(overrideLinkParams, bannerMeta) {
        const linkParams = overrideLinkParams || bannerMeta.link_overrides;

        return this.enrichLinkData(bannerMeta.link, bannerMeta, linkParams);
    }

    enrichLinkData(baseLink, bannerMeta, overrideLinkParams = {}) {
        const { bannersOptions } = SingularState.getInstance().getSingularConfig()

        let link = baseLink;
        if (bannersOptions && bannersOptions.isWebToAppSupported) {
            link = Singular.buildWebToAppLink(baseLink) || baseLink;
        }

        const linkURL = new URL(link)

        linkURL.searchParams.set(Params.Source, BANNER_SOURCE);
        
        Object.entries(overrideLinkParams).forEach(([key, value]) => {
            if (!value) {
                return;
            }

            linkURL.searchParams.set(key, value);
        });

        linkURL.searchParams.set(Params.BannerName, bannerMeta.name);
        linkURL.searchParams.set(Params.BannerID, bannerMeta.id);

        return linkURL.toString();
    }

    addUrlChangeListener() {
        let currentPage = location.href;
        this.urlChangeInterval = setInterval(() => {
            if (currentPage != location.href)
            {
                currentPage = location.href;

                this.hideBanner();
                this.showBanner();
            }
        }, 500);
    }

    removeUrlChangeListener() {
        clearInterval(this.urlChangeInterval);
        this.urlChangeInterval = null;
    }

    getBannerLastDismissed = () => SingularState.getInstance()._storage.getItem(Storage.BannerLastDismissedKey);

    setBannerLastDismissed = () => {
        SingularState.getInstance()._storage.setItem(Storage.BannerLastDismissedKey, Utils.getCurrentTimestamp());
    };
}
