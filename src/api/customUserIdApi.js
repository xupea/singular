import {EventTypes, Request} from '../consts/constants';
import BaseApi from './baseApi';

export default class CustomUserIdApi extends BaseApi {
    constructor() {
        super();
        this._apiType = EventTypes.CustomUserIdEventApi;
        this._endpoint = Request.Endpoints.DeviceCustomUserId;
    }
}
