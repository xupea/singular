export default class BannersOptions {
    _webToAppSupport = false;

    get isWebToAppSupported() {
        return this._webToAppSupport;
    }

    withWebToAppSupport() {
        this._webToAppSupport = true;
        return this;
    }
}
