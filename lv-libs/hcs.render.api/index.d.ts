declare interface _onMatchServerApiEventSender{
    data: any,
    page: string,
    done: (error?: any, renderContent?: any) => void
}
export declare var onMatchServerApi: (cb: (sender: _onMatchServerApiEventSender) => void) => void;
export declare var load: (page, content, cb: (sender: _onMatchServerApiEventSender) => void) => void;
export declare var onError:(cb: (error: any) => void) => void;