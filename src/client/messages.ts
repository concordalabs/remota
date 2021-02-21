enum Messages {
  PageDOMChanged = 1,
  PageDOMRequested,
  PageCursorMoved,
  PageCursorClicked,
  PageScrollChanged,
  PageTextInputChanged,
  PageUrlChanged,
  PagePermissionsChanged,

  PromptControlRequest = 18,
  ControlUpdate,
  PromptJoinRequest,
  JoinUpdate,
}

export default Messages;
