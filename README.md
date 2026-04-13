# h5-game

H5 lobby project for Cocos integration.

## Tech Stack

- Vue 3 + TypeScript + Vite
- Vant 4
- Vue Router
- Pinia + pinia-plugin-persistedstate
- Axios
- Dayjs
- VueUse
- @vitejs/plugin-legacy

## Run

```bash
nvm use
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

Build output is in `dist/`. Copy it to Cocos WebView resources.

## Cocos Bridge

H5 sends messages with `src/bridge/bridge.ts`.

Core action:

- `enterTable`

Example payload:

```json
{
  "action": "enterTable",
  "payload": {
    "tableId": "table_20001",
    "roomId": "room_1",
    "gameCode": "poker-texas",
    "token": "xxx",
    "from": "h5-lobby"
  }
}
```

Cocos can call back into H5 with:

```js
window.__H5_GAME_ON_COCOS_MESSAGE__(rawJsonOrSchemeUrl)
```
