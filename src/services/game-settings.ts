
let g_settings = {}
function settings() {
    const _window: any = window;
    if (!_window) {
        return g_settings;
    }

    if (!_window.settings) {
        _window.settings = g_settings;
    }
    else {
        g_settings = _window.settings;
    }

    return g_settings;
};

class ISetting {
    public value: any;
}

class StringSetting implements ISetting {
    private _lastRaw: any;
    private _value: string;

    constructor(private _key: string, private _default: string, private _accept: string[] = null) {
        this._value = this._default;
    }

    public get value(): string {
        this._sync();
        return this._value;
    }

    public set value(value: string) {
        if (this._isValid(value)) {
            settings()[this._key] = value;
        }   
    }

    private _isValid(value: string): boolean {
        return (this._accept == null || this._accept.indexOf(value) >= 0);
    }

    private _sync() {
        let raw = settings()[this._key];
        if (raw !== this._lastRaw) {
            this._lastRaw = raw;

            raw = raw.toString();
            this._value = this._isValid(raw) ? raw : this._default;
        }
    }
}

class BooleanSetting implements ISetting {
    private _lastRaw: any;
    private _value: boolean;

    constructor(private _key: string, private _default: boolean) {
        this._value = this._default;
    }

    public get value(): boolean {
        this._sync();
        return this._value;
    }

    public set value(value: boolean) {
        settings()[this._key] = value;
    }

    private _sync() {
        let raw = settings()[this._key];
        if (raw !== this._lastRaw) {
            this._lastRaw = raw;

            if (raw == null) {
                this._value = this._default;
            } else if (typeof raw === 'boolean') {
                this._value = raw;
            } else {
                raw = raw.toString().toLowerCase();
                if (raw === 'false')
                    this._value = false;
                else if (raw === 'true')
                    this._value = true;
                else {
                    this._value = this._default;
                }
            }
        }
    }
}

class NumberSetting implements ISetting {
    private _lastRaw: any;
    private _value: number;

    constructor(private _key: string, private _default: number, private _min: number = null, private _max: number = null) {
        this._value = this._default;
    }

    public get value(): number {
        this._sync();
        return this._value;
    }

    public set value(value: number) {
        settings()[this._key] = this._constrain(value);
    }

    private _constrain(value: number): number {
        if (!isFinite(value)) {
            return this._default;
        }

        if (this._min != null && this._min > value) {
            return this._min;
        }

        if (this._max != null && this._max < value) {
            return this._max;
        }

        return value;
    }

    private _sync() {
        let raw = settings()[this._key];
        if (raw !== this._lastRaw) {
            this._lastRaw = raw;

            if (typeof raw === 'string') {
                raw = parseInt(raw);
            }

            if (typeof raw === 'number') {
                this._value = this._constrain(raw);
            }
            else {
                this._value = this._default;
            }
        }
    }
}

export abstract class GameSettings {
    private static _settings: {[key: string]: ISetting} = (() => {
        const settingModders = {
            'debug': new BooleanSetting('debug', false),
            'fps': new NumberSetting('fps', 8, 4, 60),
            'algorithm': new StringSetting('algorithm', 'closest', ['closest', 'random']),
            'pace': new NumberSetting('pace', 4, 1)
        };
        
        const queryStringStart = location.href.indexOf('?') + 1;
        if (queryStringStart > 0) {
            const params = location.href.substr(queryStringStart).split('&');
            for (const param of params) {
                const kvp = param.split('=');
                const key = kvp[0].toLowerCase();
                if (settingModders[key]) {
                    const value = decodeURIComponent(kvp[1] || '');
                    settings()[key] = value;
                }
            }
        }

        return settingModders; 
    })();

    public static get FPS(): number { return this._settings.fps.value; }
    public static get Debug(): boolean { return this._settings.debug.value; }
    public static get Algorithm(): string { return this._settings.algorithm.value; }
    public static get Pace(): number { return this._settings.pace.value; }
}
