import {LogLevel} from "../consts/constants";

export default class SingularLog {
    static _logLevel = LogLevel.None;

    static setLogLevel(logLevel) {
        this._logLevel = logLevel;
    }

    static debug(message) {
        if (this._logLevel === LogLevel.Debug) {
            console.log(message);
        }
    }

    static info(message) {
        if (this._logLevel >= LogLevel.Info) {
            console.log(message);
        }
    }

    static warn(message) {
        if (this._logLevel >= LogLevel.Warn) {
            console.warn(message);
        }
    }
}