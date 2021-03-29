<h1 align="center">
  Remota
</h1>

<p align="center">Ship. Share. Collaborate.</p>
<p align="center">No-download, easy, interactive screen sharing built for onboarding and support</p>

## Usage: a basic example

⚠️ You need to create an account at [remota.xyz](https://remota.xyz) before starting.

First, install `@concordalabs/remota` package through npm or yarn. Once installed, add the following snippet somewhere in your application and import the created file at the start of your application.

```js
// src/remota.js
import Remota from "@concordalabs/remota";

(() => {
  const query = new URLSearchParams(new URL(window.location.href).search);
  const code = query.get("code");
  if (!code) return;

  const remota = Remota.host({
    clientId: "local",
    key: "local",
  });

  remota.start(code);
  remota.onControlChangePrompt(({ user }) => remota.acceptControlChange(user))
  remota.onJoinPrompt(({ user }) => remota.acceptUser(user))
})()
```

The example above is simplified to automatically try to connect to Remota in case you pass `code` as a URL query parameter. It does the following:

1. Get the query parameter
2. Create a Remota session client as a host (the user will always be a session host)
3. Start remota
4. Define how to handle two Remota events: control change requests and other peers joining (the agent). In here, it will accept both automatically, but you can design a modal to get the confirmation (or use `window.confirm`).

Once you have the above up example set-up, head to [remota.xyz](https://remota.xyz), and start a new session. With access code in hands, open your application using `http://your-app?code=YOUR_CODE_HERE`.

Now both clients should be connected and you should be able to co-browse.

## API

⚠️ At the moment, although in TypeScript, methods still need to be properly documented. This should allow anyone to create their own branded UIs, if required. The following methods are used in the most simple set-ups and will already be integrated with the embedded UI.

### .onControlChangePrompt(({ user }) => { ... })

It is triggered when an agent requests control. `.acceptControlChange(user)` and `.denyControlChange()` can be used to reply to this prompt. Example:

```js
remota.onControlChangePrompt(({ user }) => window.confirm('Pass control?')
  ? remota.acceptControlChange(user)
  : remota.denyControlChange())
```

### remota.onJoinPrompt(({ user }) => { ... })

It is triggered when an agent is joining the session. `.acceptUser(user)` and `.denyUser(user)` can be used to reply to this prompt. Example:

```js
remota.onJoinPrompt(({ user }) => window.confirm('Allow user?')
  ? remota.acceptUser(user)
  : remota.denyUser(user))
```
