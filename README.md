# Nine Hundred Squares

## dev

pnpm tauri [android|ios] dev

$env:TAURI_CLI_NO_DEV_SERVER_WAIT="true" 
adb reverse tcp:1420 tcp:1420
pnpm tauri android build -t aarch64

```
pnpm tauri android dev --host 10.0.2.2
pnpm tauri android dev
```


## Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

