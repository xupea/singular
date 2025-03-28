export default class LinkParams {

    _android_redirect;
    _android_dl;
    _android_ddl;
    _ios_redirect;
    _ios_dl;
    _ios_ddl;

    withAndroidRedirect(redirect) {
        this._android_redirect = redirect;
        return this;
    }

    withAndroidDL(androidDL) {
        this._android_dl = androidDL;
        return this;
    }

    withAndroidDDL(androidDDL) {
        this._android_ddl = androidDDL;
        return this;
    }

    withIosRedirect(iosRedirect) {
        this._ios_redirect = iosRedirect;
        return this;
    }

    withIosDL(iosDL) {
        this._ios_dl = iosDL;
        return this;
    }

    withIosDDL(iosDDL) {
        this._ios_ddl = iosDDL;
        return this;
    }
}