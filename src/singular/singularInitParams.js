export default class SingularInitParams {
    constructor(singularDeviceId) {
        this._singularDeviceId = singularDeviceId;
    }

    get singularDeviceId() {
        return this._singularDeviceId;
    }
}
