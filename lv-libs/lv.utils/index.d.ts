
export interface CheckInfoResutl {
    errorType: string;
    field: string;
    description: string;
}
declare interface _RouteInfo {
    params: any;
}
declare interface _Request {
    currentLanguageCode: string;
    routeInfo: _RouteInfo,
    get: (key: string) => any;
    protocol: any;
}
declare interface _Response {
    
}
export interface _Event {
    req: _Request
}
export interface _Pager {
    totalPages: number;
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    first: number;
    last: number;
    numOfGroups: number;
    numOfShow2: number;
    groupIndex: number;
    pagers: Array<any>
}
export interface __ParalellCallerEmit {
    done: (error?: any) => void;
}
export interface _ParalellCaller {
    call: (emit: __ParalellCallerEmit) => void;
    done: (cb: (error?: any, result?: any) => void) => void;
}
export declare var objectID: (value: string) => any
export declare var checkRequireFieldsList: (listOfFields: Array<string>, data: any) => Array<CheckInfoResutl>
export declare var checkRequireFields: (listOfFields: Array<string>, data: any) => Array<CheckInfoResutl>
export declare var getCurrentLanguageCode: (event: _Event) => string;
export declare var getValue: (data: any, path: string) => any;
export declare var isNull: (value: any) => boolean;
export declare var _try: (fn: Function, event: any) => void;
export declare var createPager: (numOfShow, totalItems, pageSize, pageIndex) => _Pager;
export declare var getUTCDate: (val: any) => any;
export declare var writeData: (eventOrRequest: _Event | _Request, data: any) => void;
export declare var readData: (eventOrRequest: _Event | _Request, cb: (error?: any, result?: any) => void) => void;
export declare var trimData: (data: any) => any;
export declare var getCahce: () => any;
export declare var loadModule: (name: string) => any;
export declare var getCurrentDir: () => string;
export declare var writeError: (eventOrRequest: _Event | _Request, error: any) => void;
export declare var redirect: (res: _Response, url: string) => void;
export declare var getRootUrl: (eventOrRequest: _Event | _Request) => string;
export declare var setValue: (data: any, path: string, value: any) => any;
export declare var convertDateFields: (field: Array<string>, data: any) => any;
export declare var getUrlParams: (eventOrRequest: _Event | _Request) => any;
export declare var getSchema: (data: any) => Array<string>;
export declare var createEqualRegExp: (value: string) => RegExp;
export declare var sha: (value: string) => string;
export declare var paralellCaller: () => _ParalellCaller;
export declare var isEmail: (value: string) => boolean;
export declare var newGuid: () => any;
export declare var readJSON: (eventOrRequest: _Event | _Request, cb: (error?: any, result?: any) => void) => void;
export declare var writeJSON: (eventOrRequest: _Event | _Request, data: any) => void;
export declare var writeImage: (event: _Event, data: any, cacheKey: string) => void;
export declare var downLoad: (event: _Event, data: any, fileName: string) => void;
export declare var convertToArrayTable: (list: any, cb?: (error?: any, result?: any) => void) => Promise<any>;
export declare var createWorkbook: (list: any, cb: (error?: any, result?: any) => void) => Promise<any>;
export declare var downLoadExcel: (event: _Event, data: any, fileName: string, cb: (error?: any, result?: any) => void) => void;
export declare var clear_tress: (value: string) => string;
export declare var toAbsUrl: (eventOrRequest: _Event | _Request, relUrl: string) => string;