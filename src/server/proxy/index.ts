export enum ProxyMessages {
  PageDOMChanged = 1,
  PageDOMRequested,
  PageCursorMoved,
  PageCursorClicked,
  PageScrollChanged,
  PageTextInputChanged,
  PageUrlChanged,
  PagePermissionsChanged,
}

export interface Proxy {
  send(type: ProxyMessages, payload: any): void;
  onMessage(cb: any): void;
  close(): void;
}
