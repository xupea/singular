'use strict';
import Singular from "./singular/singular";
import Config from "./singular/singularConfig";
import OverrideLinkParams from "./singular/linkParams";
import Banners from "./singular/bannersOptions";

// This workaround is used to prevent from the SDK to be loaded twice
let SingularObject = Singular;
let ConfigObject = Config;
let LinkParamsObject = OverrideLinkParams;
let BannersOptionsObject = Banners;

// Check if we're on the client side before accessing window
if (typeof window !== 'undefined') {
    if (!window.singularSdk) {
        window.singularSdk = SingularObject;
        window.SingularConfig = ConfigObject;
    } else {
        SingularObject = window.singularSdk;
        ConfigObject = window.SingularConfig;
    }
}

export const singularSdk = SingularObject;
export const SingularConfig = ConfigObject;
export const LinkParams = LinkParamsObject;
export const BannersOptions = BannersOptionsObject;