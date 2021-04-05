<h1 align="center">
  Remota
</h1>

<p align="center">Ship. Share. Collaborate.</p>
<p align="center">No-download, easy, interactive screen sharing built for onboarding and support</p>

## Usage: a basic example

⚠️ You need to create an account at [remota.xyz](https://remota.xyz) before starting.

First, install Remota through one of the following methods:

- `npm install @concordalabs/remota`
- `yarn add @concordalabs/remota`
- Add this to your HTML: `<script src="https://unpkg.com/@concordalabs/remota/dist/remota.min.js"></script>`

Once installed, add the following snippet somewhere in your application and import the created file at the start of your application.

```js
import Remota from "@concordalabs/remota"; // only required if using npm/yarn method

const query = new URLSearchParams(new URL(window.location.href).search);
const code = query.get("code");
if (!code) return;

const remota = Remota.host({ clientId: "your-clientId", key: "your-key", code });

remota.onControlChangePrompt(({ user }) => remota.acceptControlChange(user));
remota.onClose(() => alert('session finished'));
```

The example above is simplified to automatically try to connect to Remota in case you pass `code` as a URL query parameter. It does the following:

1. Get the query parameter
2. Create a Remota session client as a host (the user will always be a session host)
3. Start remota
4. Define how to handle two Remota events: control change requests and session ending. In here, it will accept control requres automatically, but you can design a modal to get the confirmation (or use `window.confirm`).

Once you have the above up example set-up, head to [remota.xyz](https://remota.xyz), and start a new session. With access code in hands, open your application using `http://your-app?code=YOUR_CODE_HERE`.

Now both clients should be connected and you should be able to co-browse.

### Hiding private data

If you need to block private information from your agents (example: password and bank details), add `remoteSecured` class to the HTML component:

```html
<input class="remoteSecured" name="bank_sort_code" value="000000" />
```

## API

The following methods are used in the most simple set-ups and will already be integrated with the default UI. Check our [TypeScript documentation](https://concordalabs.github.io/remota) in case you need to have access to other APIs (useful for custom UIs).

### .onControlChangePrompt(({ user }) => { ... })

It is triggered when an agent requests control. `.acceptControlChange(user)` and `.denyControlChange()` can be used to reply to this prompt. Example:

```js
remota.onControlChangePrompt(({ user }) => window.confirm('Pass control?')
  ? remota.acceptControlChange(user)
  : remota.denyControlChange())
```

### remota.onClose(() => { ... })

It is triggered when a user click on the `End` button from the UI. Usefull in case you want to show an alert or redirect the user somewhere.
