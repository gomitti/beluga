# Beluga

Belugaのコードです。

## 準備

### Node

```bash
npm install
```

### MongoDB

#### macOS

```bash
brew install mongodb
```

#### Ubuntu

[https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)

### uWebSocket

#### macOS

```bash
brew install libuv
```

#### Ubuntu

```bash
sudo apt install libssl-dev
```

#### コンパイル

```
git clone https://github.com/uNetworking/uWebSockets
cd uWebSockets
make
sudo make install
```

### GraphicsMagick

#### macOS

```
brew install graphicsmagick
```

#### Ubuntu

```
sudo apt install graphicsmagick
```

### node_modules

```bash
npm install
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
sh ./build.sh
env NODE_ENV=production forever start www/app.js
```