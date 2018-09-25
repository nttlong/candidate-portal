export declare var run: (rootDir, inputUrl, req, res, callback) => any;
export declare var load: (cb: (err?: any, result?: any) => void) => any;
export declare var getRoute: (url: string) => any;
export declare var set_app_dir: (path: string) => void;
export declare var exec: (info: any, req: any, res: any, handler: any) => void;
export declare var exec_authorize: (info, req, res, handler) => any;
export declare var getRootUrl: (url: string) => string;
export declare var onError: (cb: (error: any) => void) => void;