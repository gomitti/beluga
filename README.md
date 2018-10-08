# Beluga

Belugaのコードです。

これはミラーなのでプルリクが直接ここにマージされることはありません。

## Installation

### Node

```bash
npm install
```

### MongoDB

- macOS

```bash
brew install mongodb
```

- Ubuntu

[https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)

### uWebSocket

- **macOS**

```bash
brew install libuv
```

- **Ubuntu**

```bash
sudo apt install libssl-dev
```

- **ビルド**

```
git clone https://github.com/uNetworking/uWebSockets
cd uWebSockets
make
sudo make install
```

### ffmpeg

- macOS

```bash
brew install ffmpeg
```

- Ubuntu

```bash
sudo apt install ffmpeg
```

### GraphicsMagick

- macOS

```
brew install graphicsmagick
```

- Ubuntu

```
sudo apt install graphicsmagick
```

### node_modules

```bash
npm install
```

Babelがなぜかうまく動かないので再インストールします

```bash
npm uninstall @babel/plugin-proposal-decorators @babel/cli
npm install @babel/plugin-proposal-decorators@7.0.0-beta.42 @babel/cli@7.0.0-beta.42 --save-dev
```

`Error: Compilation of µWebSockets has failed and there is no pre-compiled binary available for your system. Please install a supported C++11 compiler and reinstall the module 'uws'.`が発生する場合は`fastify-ws`を再インストールすると直るかもしれません。

```bash
npm uninstall --save fastify-ws
npm install --save fastify-ws
```

### Nginx

`nginx/conf.d/beluga.conf`を参考にnginxの設定を行ってください。

## 稼働

```bash
npm run build
env NODE_ENV=production forever start www/app.js
```