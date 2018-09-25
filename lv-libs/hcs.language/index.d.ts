export declare var getResFromFile: (language: string, page: string, key: string, defaultValue: string, cb: (error?: any, value?: string) => void) => void;
export declare var getPageCaptionFromFile: (language: string, page: string, caption: string, cb: (error?: any, value?: string) => void) => void;
export declare var load: (language: string, page: string, content: string, cb: (error?: any, content?: string) => void) => void;
export declare var setDir: (path: string) => void;
export declare var getDir: () => string;
export declare var onloadData: (callback: (data: any) => void) => void;
export declare var onSaveData: (callback: (sender: any) => void) => void;
export declare var scan: (language: string, page: string, content: string, onScanItem: (sender: any) => void, scanComplete: (sender: any) => void) => void;
export declare var getPageTitle : (page, language, content) => any;