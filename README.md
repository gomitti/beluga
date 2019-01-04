# Beluga

Belugaのコードです。

これはミラーなのでプルリクが直接ここにマージされることはありません。

## Requirements

- Node 10

## Installation

### Node

```bash
npm install -g n
n 10.15.0
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

### Nginx

`nginx/conf.d/beluga.conf`を参考にnginxの設定を行ってください。

## 稼働

```bash
npm run build
env NODE_ENV=production forever start www/app.js
```