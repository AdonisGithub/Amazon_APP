//
export default class CsLocalStorage {
    static ls = null;
    static bInit = false;
    static storage = {};

    static get (key) {
        if(this.ls !== null) {
            return this.ls.get(key);
        } else {
            return key in this.storage ? this.storage[key] : null;
        }
    }

    static set (key, value) {
        if(this.ls !== null) {
            this.ls.set(key, value);
        } else {
            this.storage[key] = value;
        }
        return true;
    }

    static remove (key) {
        if(this.ls !== null) {
            return this.ls.remove(key);
        } else {
            let found = key in this.storage;
            if (found) {
                return delete this.storage[key];
            }
        }
        return false;
    }

    static clear () {
        if(this.ls !== null) {
            this.ls.clear();
        } else {
            this.storage = {};
        }
    }

    static backend() {
        if(this.ls !== null) {
            return this.ls.backend();
        } else {
            return this.storage;
        }
    }
}

if( CsLocalStorage.bInit === false) {
    try {
        CsLocalStorage.ls = require("local-storage");
        console.log("can use local-storage");
    } catch (error) {
        CsLocalStorage.ls = null;
        console.log("can't use local-storage");
    }
    CsLocalStorage.bInit = true;

/*
    CsLocalStorage.set("test1", 1);
    CsLocalStorage.set("test2", 2);
    CsLocalStorage.set("test3", 3);
    CsLocalStorage.set("test4", 4);
    CsLocalStorage.set("aaa", 5);

    console.log("cslocalstorage", CsLocalStorage.backend());
    console.log("get", CsLocalStorage.get("test3"));
    let backend = CsLocalStorage.backend();
    let found = [];
    for(let key in backend) {
        if( key.search("test") === 0) {
            found.push(key);
        }
    }
    for(let key of found) {
        CsLocalStorage.remove(key);
    }
    console.log("cslocalstorage", CsLocalStorage.backend());
*/
}
