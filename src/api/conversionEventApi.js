import {EventTypes, Params} from '../consts/constants';
import EventApi from './eventApi';
import SingularState from "../singular/singularState";

export default class ConversionEventApi extends EventApi {
    constructor(eventName) {
        super(eventName);

        this._apiType = EventTypes.ConversionEventApi;

        this._params = {
            ...this._params,
            [Params.IsConversion]: true,
            [Params.WebUrl]: SingularState.getInstance().getWebUrl(),
        }
    }
}
