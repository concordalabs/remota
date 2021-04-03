export const CSS = `
#__remote-status-bar-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 9999;

  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: center;

  font: 14px Arial;
  color: #fff;
}

#__remote-status-bar {
  background: rgba(0,0,0,.75);
  margin: 0 auto 10px;
  text-align: center;
  border-radius: 5px;
  padding: 6px 24px;
  border: 1px solid rgba(0,0,0,.5);
  backdrop-filter: saturate(180%) blur(6px);
}

#__remote-status-bar-status {
  font-weight: 700;
  margin-bottom: 4px;
  background: #52c41a85;
  border-radius: 2px;
  padding: 5px 14px;
  text-align: center;
}

.__remote-status-bar-item {
  display: flex;
  justify-content: center;
}

.__remote-status-bar-actions {
  cursor: pointer;
  margin-left: 12px;
  margin-right: 12px;
  font-weight: 700;
}

#__remote-status-bar-request-control {
  fill: #f5f5f5;
}

#__remote-status-bar-end {
  fill: #ff7875;
  color: #ff7875;
}

.__remote-status-bar-actions:hover {
  opacity: .9
}

.__remote-status-bar-actions:active {
  opacity: .8
}

.__remote-status-bar-actions-label {
  font-size: 12px;
  margin-top: 5px;
}

.__remote-status-bar-details {
  text-align: center;
  font-size: 12px;
  padding: 6px 0;
  margin-right: 10px;
  font-weight: 700;
}

#__remote-status-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 4px solid #333;
  box-sizing: border-box;
  pointer-events: none;
  z-index: 999;
}

#__remote-highlight {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
}

#__remote-status-cursor {
  z-index: 999;
  position: absolute;
  left: -48px;
  top: -48px;
  width: 48px;
  height: 48px;
  color: #52c41a;
  -webkit-filter: drop-shadow( 2px 2px 2px rgba(0, 0, 0, 0.3));
  filter: drop-shadow( 2px 2px 2px rgba(0, 0, 0, 0.3));
}`;

const ICON_SIZE = 32;

const CursorIcon = `
<svg id="__remote-status-cursor" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 28 28" enable-background="new 0 0 28 28" xml:space="preserve">
  <polygon fill="#FFFFFF" points="8.2,20.9 8.2,4.9 19.8,16.5 13,16.5 12.6,16.6 "/>
  <polygon fill="#FFFFFF" points="17.3,21.6 13.7,23.1 9,12 12.7,10.5 "/>
  <rect fill="#52c41a" x="12.5" y="13.6" transform="matrix(0.9221 -0.3871 0.3871 0.9221 -5.7605 6.5909)" width="2" height="8"/>
  <polygon fill="#52c41a" points="9.2,7.3 9.2,18.5 12.2,15.6 12.6,15.5 17.4,15.5 "/>
</svg>
`;

const ControlIcon = `
<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="${ICON_SIZE}" viewBox="0 0 24 24" width="${ICON_SIZE}"><g><rect fill="none" height="24" width="24"/></g><g><g/><g><circle cx="12" cy="4" r="2"/><path d="M15.89,8.11C15.5,7.72,14.83,7,13.53,7c-0.21,0-1.42,0-2.54,0C8.24,6.99,6,4.75,6,2H4c0,3.16,2.11,5.84,5,6.71V22h2v-6h2 v6h2V10.05L18.95,14l1.41-1.41L15.89,8.11z"/></g></g></svg>
`;

const EndIcon = `
<svg xmlns="http://www.w3.org/2000/svg" height="${ICON_SIZE}" viewBox="0 0 24 24" width="${ICON_SIZE}"><path d="M0 0h24v24H0z" fill="none"/><path d="M21 19.1H3V5h18v14.1zM21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/><path d="M21 19.1H3V5h18v14.1zM21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="none"/><path d="M14.59 8L12 10.59 9.41 8 8 9.41 10.59 12 8 14.59 9.41 16 12 13.41 14.59 16 16 14.59 13.41 12 16 9.41z"/></svg>
`;

export const HTML = `
<div class='remoteSecured'>
  ${CursorIcon}
  <div id='__remote-status-overlay'></div>
  <canvas id='__remote-highlight'></canvas>
  <div id='__remote-status-bar-container'>
    <div id='__remote-status-bar'>
      <div class='__remote-status-bar-item'>
        <div class='__remote-status-bar-details'>
          <div id='__remote-status-bar-status' >Connecting...</div>
          <div id='__remote-status-bar-control'></div>
        </div>
        <div id='__remote-status-bar-request-control' class='__remote-status-bar-actions'>
          ${ControlIcon}<div class='__remote-status-bar-actions-label'>Request</div>
        </div>
        <div id='__remote-status-bar-end' class='__remote-status-bar-actions'>
          ${EndIcon}<div class='__remote-status-bar-actions-label'>End</div>
        </div>
      </div>
    </div>
  </div>
</div>
`;
