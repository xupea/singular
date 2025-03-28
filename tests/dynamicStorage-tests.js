import DynamicStorage from '../src/storage/dynamicStorage';
import {Storage, LogLevel} from '../src/consts/constants';
import SingularLog from "../src/singular/singularLog";
import SingularConfig from "../src/singular/singularConfig";
import SingularState from "../src/singular/singularState";

window.crypto = require('@trust/webcrypto');

const assert = require('assert');
const sinon = require('sinon');
const apiKey = 'random_key';
const productId = 'random_productId';

describe('dynamicStorage', () => {
    let storagePrefix = `${apiKey}_${productId}`;

    describe('dynamicStorage using localStorage', () => {
        beforeEach(() => {
            SingularLog.setLogLevel(LogLevel.Debug);
            localStorage.clear();
            sessionStorage.clear();
            sinon.restore();
        });

        afterEach(() => {
            DynamicStorage._availableStorageType = null;
        });

        it('should set an item to storage', () => {
            const storage = new DynamicStorage(Storage.Types.Local, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';

            storage.setItem(key, value);

            assert(localStorage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and local storage are not equal');
        });

        it('should set an item to storage and then override it', () => {
            const storage = new DynamicStorage(Storage.Types.Local, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';
            const secondValue = 'second_value';

            storage.setItem(key, value);

            assert(localStorage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and local storage are not equal');

            storage.setItem(key, secondValue);

            assert(localStorage.getItem(`${storagePrefix}_${key}`) === secondValue, 'The second value did not override the first one');
        });

        it('should set an item to storage and then retrieve it', () => {
            const storage = new DynamicStorage(Storage.Types.Local, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';

            storage.setItem(key, value);

            assert(localStorage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and local storage are not equal');
            assert(storage.getItem(key) === value, 'Dynamic storage did not retrieve the correct value');
        });

        it('should set an item to storage and then delete it', () => {
            const storage = new DynamicStorage(Storage.Types.Local, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';

            storage.setItem(key, value);

            assert(localStorage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and local storage are not equal');

            storage.removeItem(key);

            assert(localStorage.getItem(`${storagePrefix}_${key}`) == null, 'Value was not deleted from local storage');
        });

        it('should set an item to storage, when local storage is not available', () => {
            const stub = sinon.stub(DynamicStorage, '_isLocalStorageAvailable').returns(false);
            const storage = new DynamicStorage(Storage.Types.Local, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';

            storage.setItem(key, value);

            assert(sessionStorage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and session storage are not equal');
            assert(stub.called, "Local storage was available although it shouldn't");
        });

        it('should set an item to storage and then override it, when local storage is not available', () => {
            const stub = sinon.stub(DynamicStorage, '_isLocalStorageAvailable').returns(false);
            const storage = new DynamicStorage(Storage.Types.Local, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';
            const secondValue = 'second_value';

            storage.setItem(key, value);

            assert(sessionStorage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and local session are not equal');

            storage.setItem(key, secondValue);

            assert(sessionStorage.getItem(`${storagePrefix}_${key}`) === secondValue, 'The second value did not override the first one');
            assert(stub.called, "Local storage was available although it shouldn't");
        });

        it('should set an item to storage and then retrieve it, when local storage is not available', () => {
            const stub = sinon.stub(DynamicStorage, '_isLocalStorageAvailable').returns(false);
            const storage = new DynamicStorage(Storage.Types.Local, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';

            storage.setItem(key, value);

            assert(sessionStorage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and session storage are not equal');
            assert(storage.getItem(key) === value, 'Dynamic storage did not retrieve the correct value');
            assert(stub.called, "Local storage was available although it shouldn't");
        });

        it('should set an item to storage and then delete it, when local storage is not available', () => {
            const stub = sinon.stub(DynamicStorage, '_isLocalStorageAvailable').returns(false);
            const storage = new DynamicStorage(Storage.Types.Local, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';

            storage.setItem(key, value);

            assert(sessionStorage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and session storage are not equal');

            storage.removeItem(key);

            assert(sessionStorage.getItem(`${storagePrefix}_${key}`) == null, 'Value was not deleted from session storage');
            assert(stub.called, "Local storage was available although it shouldn't");
        });

        it('should set an item to storage, when local and session storage are not available', () => {
            const localStub = sinon.stub(DynamicStorage, '_isLocalStorageAvailable').returns(false);
            const sessionStub = sinon.stub(DynamicStorage, '_isSessionStorageAvailable').returns(false);
            const storage = new DynamicStorage(Storage.Types.Local, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';

            storage.setItem(key, value);

            assert(storage._storage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and memory storage are not equal');
            assert(localStub.called, "Local storage was available although it shouldn't");
            assert(sessionStub.called, "Session storage was available although it shouldn't");
        });

        it('should set an item to storage and then override it, when local and session storage are not available', () => {
            const localStub = sinon.stub(DynamicStorage, '_isLocalStorageAvailable').returns(false);
            const sessionStub = sinon.stub(DynamicStorage, '_isSessionStorageAvailable').returns(false);
            const storage = new DynamicStorage(Storage.Types.Local, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';
            const secondValue = 'second_value';

            storage.setItem(key, value);

            assert(storage._storage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and memory storage are not equal');

            storage.setItem(key, secondValue);

            assert(storage._storage.getItem(`${storagePrefix}_${key}`) === secondValue, 'The second value did not override the first one');
            assert(localStub.called, "Local storage was available although it shouldn't");
            assert(sessionStub.called, "Session storage was available although it shouldn't");
        });

        it('should set an item to storage and then retrieve it, when local and session storage are not available', () => {
            const localStub = sinon.stub(DynamicStorage, '_isLocalStorageAvailable').returns(false);
            const sessionStub = sinon.stub(DynamicStorage, '_isSessionStorageAvailable').returns(false);
            const storage = new DynamicStorage(Storage.Types.Local, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';

            storage.setItem(key, value);

            assert(storage._storage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and memory storage are not equal');
            assert(localStub.called, "Local storage was available although it shouldn't");
            assert(sessionStub.called, "Session storage was available although it shouldn't");
        });

        it('should set an item to storage and then delete it, when local and session storage are not available', () => {
            const localStub = sinon.stub(DynamicStorage, '_isLocalStorageAvailable').returns(false);
            const sessionStub = sinon.stub(DynamicStorage, '_isSessionStorageAvailable').returns(false);
            const storage = new DynamicStorage(Storage.Types.Local, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';

            storage.setItem(key, value);

            assert(storage._storage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and memory storage are not equal');

            storage.removeItem(key);

            assert(storage._storage.getItem(`${storagePrefix}_${key}`) == null, 'Value was not deleted from memory storage');
            assert(localStub.called, "Local storage was available although it shouldn't");
            assert(sessionStub.called, "Session storage was available although it shouldn't");
        });
    });

    describe('dynamicStorage using sessionStorage', () => {
        beforeEach(() => {
            DynamicStorage._availableStorageType = null;
            sessionStorage.clear();
            sinon.restore();
        });

        afterEach(() => {
            DynamicStorage._availableStorageType = null;
        });

        it('should set an item to storage', () => {
            const storage = new DynamicStorage(Storage.Types.Session, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';

            storage.setItem(key, value);

            assert(sessionStorage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and session storage are not equal');
        });

        it('should set an item to storage and then override it', () => {
            const storage = new DynamicStorage(Storage.Types.Session, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';
            const secondValue = 'second_value';

            storage.setItem(key, value);

            assert(sessionStorage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and session storage are not equal');

            storage.setItem(key, secondValue);

            assert(sessionStorage.getItem(`${storagePrefix}_${key}`) === secondValue, 'The second value did not override the first one');
        });

        it('should set an item to storage and then retrieve it', () => {
            const storage = new DynamicStorage(Storage.Types.Session, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';

            storage.setItem(key, value);

            assert(sessionStorage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and session storage are not equal');
            assert(storage.getItem(key) === value, 'Dynamic storage did not retrieve the correct value');
        });

        it('should set an item to storage and then delete it', () => {
            const storage = new DynamicStorage(Storage.Types.Session, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';

            storage.setItem(key, value);

            assert(sessionStorage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and session storage are not equal');

            storage.removeItem(key);

            assert(sessionStorage.getItem(`${storagePrefix}_${key}`) == null, 'Value was not deleted from session storage');
        });

        it('should set an item to storage, when session storage is not available', () => {
            const sessionStub = sinon.stub(DynamicStorage, '_isSessionStorageAvailable').returns(false);
            const storage = new DynamicStorage(Storage.Types.Session, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';

            storage.setItem(key, value);

            assert(storage._storage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and memory storage are not equal');
            assert(sessionStub.called, "Session storage was available although it shouldn't");
        });

        it('should set an item to storage and then override it, when session storage is not available', () => {
            const sessionStub = sinon.stub(DynamicStorage, '_isSessionStorageAvailable').returns(false);
            const storage = new DynamicStorage(Storage.Types.Session, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';
            const secondValue = 'second_value';

            storage.setItem(key, value);

            assert(storage._storage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and memory storage are not equal');

            storage.setItem(key, secondValue);

            assert(storage._storage.getItem(`${storagePrefix}_${key}`) === secondValue, 'The second value did not override the first one');
            assert(sessionStub.called, "Session storage was available although it shouldn't");
        });

        it('should set an item to storage and then retrieve it, when session storage is not available', () => {
            const sessionStub = sinon.stub(DynamicStorage, '_isSessionStorageAvailable').returns(false);
            const storage = new DynamicStorage(Storage.Types.Session, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';

            storage.setItem(key, value);

            assert(storage._storage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and memory storage are not equal');
            assert(sessionStub.called, "Session storage was available although it shouldn't");
        });

        it('should set an item to storage and then delete it, when session storage is not available', () => {
            const sessionStub = sinon.stub(DynamicStorage, '_isSessionStorageAvailable').returns(false);
            const storage = new DynamicStorage(Storage.Types.Session, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';

            storage.setItem(key, value);

            assert(storage._storage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and memory storage are not equal');

            storage.removeItem(key);

            assert(storage._storage.getItem(`${storagePrefix}_${key}`) == null, 'Value was not deleted from memory storage');
            assert(sessionStub.called, "Session storage was available although it shouldn't");
        });
    });

    describe('dynamicStorage using memory', () => {
        it('should set an item to storage', () => {
            const storage = new DynamicStorage(Storage.Types.Memory, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';

            storage.setItem(key, value);

            assert(storage._storage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and memory storage are not equal');
        });

        it('should set an item to storage and then override it', () => {
            const storage = new DynamicStorage(Storage.Types.Memory, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';
            const secondValue = 'second_value';

            storage.setItem(key, value);

            assert(storage._storage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and memory storage are not equal');

            storage.setItem(key, secondValue);

            assert(storage._storage.getItem(`${storagePrefix}_${key}`) === secondValue, 'The second value did not override the first one');
        });

        it('should set an item to storage and then retrieve it', () => {
            const storage = new DynamicStorage(Storage.Types.Memory, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';

            storage.setItem(key, value);

            assert(storage._storage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and memory storage are not equal');
            assert(storage.getItem(key) === value, 'Dynamic storage did not retrieve the correct value');
        });

        it('should set an item to storage and then delete it', () => {
            const storage = new DynamicStorage(Storage.Types.Memory, storagePrefix);
            const value = 'test_value';
            const key = 'test_key';

            storage.setItem(key, value);

            assert(storage._storage.getItem(`${storagePrefix}_${key}`) === value, 'Values in dynamic storage and memory storage are not equal');

            storage.removeItem(key);

            assert(storage._storage.getItem(`${storagePrefix}_${key}`) == null, 'Value was not deleted from memory storage');
        });
    });
});
