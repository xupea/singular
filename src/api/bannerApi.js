import {EventTypes, Request, Params} from "../consts/constants";
import BaseApi from "./baseApi";
import SingularState from "../singular/singularState";
import Utils from "../utils/utils";
import SingularLog from "../singular/singularLog";

export default class BannerApi extends BaseApi {

    constructor() {
        super();
        this._apiType = EventTypes.FetchBannerApi;
        this._method = Request.GetMethod;
        this._endpoint = Request.Endpoints.FetchBanner;
        const singularInstance = SingularState.getInstance();
        this._params = {
            [Params.Owner]: singularInstance.getSingularConfig().apikey,
            [Params.Locale]: navigator.language,
            [Params.CurrentDeviceTime]: Utils.getCurrentTimestamp(),
            [Params.Timezone]: Utils.getTimeZone(),
            [Params.BannerShowsCounter]: '1',
            [Params.Keyspace]: Params.SingularDeviceId,
            [Params.ProductId]: singularInstance.getSingularConfig().productId,
            [Params.IsFirstVisit]: singularInstance.isFirstVisit(),
            [Params.SdkVersion]: Utils.getSdkVersion(),
        }
    }

    async sendRequest(bannerLastDismissed) {
        this._params[Params.BannerSourceUrl] = location.href;
        if (bannerLastDismissed) {
            this._params[Params.LastDismissed] = bannerLastDismissed;
        }

        return await super.sendRequest();
    }

    _buildRequestUrl(queryString) {
        return `${Request.BaseUrl.replace('v1/', '')}${this._endpoint}${queryString}`;
    }

    isValidResponse(response) {
        //validate keys
        const { display, meta } = response;
        if (!display || !meta) {
            SingularLog.debug(`BannerApi.isValidResponse: missing display or meta keys`);
            return false; 
        }

        return Request.FetchBannerResponseLinkKey in meta;
    }

    handleResponse(request) {
        try {
            SingularLog.debug(`handeling response of banner request: ${request}`);
            const response = JSON.parse(request.responseText);
            if (!response) {
                return;
            }

            const validResponse = request.status === Request.ValidResponseCode && this.isValidResponse(response);
            if (!validResponse) {
                SingularLog.debug(`response is not valid`);
                return;
            }

            return response;
        } catch (e) {
            SingularLog.debug(`error processing response`);
        }
    }  
}
