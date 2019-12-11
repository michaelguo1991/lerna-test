# Using Device SDK for MQTT for Node 

* [安装](#安装)
* [快速开始](#快速开始)
* [功能列表](#功能列表)
* [代码示例](#代码示例)
* [API](#API)
  * [DeviceInfo](#DeviceInfo)
  * [SubDeviceInfo](#SubDeviceInfo)
  * [SECURE_MODE](#SECURE_MODE)
  * [MqttDeviceClient](#MqttDeviceClient)
    * [属性](#属性)
    * [Event](#event-connect)
    * [Contructor](#constructor)
    * [open](#promise-open)
    * [close](#promise-close)
    设备数据上报相关
    * [deviceData.queryTag()](#queryTag)
    接收云端指令相关
    * deviceCommand.onInvokeService()
  * [MqttGatewayClient](#MqttGatewayClient)
* License

## 安装

> 安装之前，首先需要安装Node.js运行环境，版本 `>=8.0.0`

使用`npm install`命令安装：

```bash
$ npm install --save iot-node-sdk
```

## 快速开始

```javascript
const {MqttDeviceClient} = require('iot-node-sdk');

// 实例化client
const clientOptions = {
  brokerUrl: '{protocol}:{host}:{port}',
  secureMode: SECURE_MODE.VIA_DEVICE_SECRET,
  productKey: '', deviceKey: '', deviceSecret: ''
}
const client = new MqttDeviceClient(clientOptions);

// 监听连接成功事件
client.on('connect', () => {
	console.log('connected');
})

client.on('close', () => {
  console.log('connection closed');
})

// 开启连接
client.open().then(async() => {
	// 查询设备标签信息
  const tagResponse = await client.deviceData.queryTag();
  console.log(tagResponse.data);  
});

// 关闭连接
client.close();
```

更多示例请参加[代码示例](#代码示例)

## 功能列表

该模块支持如下功能：

* 获取、上报和删除设备标签、属性
* 上报设备单个（离线）测点信息、批量上报设备（离线）测点信息
* 上报设备事件、信息（透传）
* 接收云端指令，包括云端设置设备测点信息和调用设备服务
* 接收云端透传的信息
* 管理子设备
  * 注册设备
  * 获取、添加和删除子设备的拓扑关系
  * （批量）上线子设备、下线子设备
  * 接收云端启用、禁用和删除子设备信息

## 代码示例

* 连接到云端
* 发送设备数据到云端
* 接收云端指令
* 子设备管理

## API

###DeviceInfo

###SubDeviceInfo

### SECURE_MODE

认证方式，用于构建client实例时使用

`const clientOptions = {..., secureMode: SECURE_MODE.VIA_DEVICE_SECRET}`

* VIA_DEVICE_SECRET - 使用静态激活认证方式
* VIA_PRODUCT_SECRET - 使用动态激活认证方式

### MqttDeviceClient

模块的核心类，可用来和云端建立连接；

连接之后，通过调用该类提供的各种方法来实现设备的数据上报以及接收云端指令；

继承自[events.EventEmitter](https://nodejs.org/api/events.html), 在和云端建立连接、收到信息、关闭连接等场景下会触发相应事件，详细请查阅[Events](#Event `'connect'`)部分

---

#### Constructor

```javascript 
MqttDeviceClient(clientOptions)
```

**参数**

* clientOptions - 设备连接云端需要的参数 `Object`，包含如下：
  * brokerUrl - 云端地址 `String`
  * secureMode  - 安全模式 `SECURE_MODE`, 取值参见 [SECURE_MODE](#SECURE_MODE)
  * productKey -  `String`
  * deviceKey - `String`
  * [productSecret] - 当使用动态激活认证方式时，必填
  * [deviceSecret] - 当使用静态激活认证方式时，必填
  * [ca] -  根证书 `string | Buffer | Array<string | Buffer>`  才用证书认证时，必传
  * [pfx] - 私钥+设备证书  `string | Buffer | Array<string | Buffer | Object>`
  * [passphrase] - 私钥密码 `string`
  * [key] - 设备端私钥 string | Buffer | Array<string | Buffer | Object>` 
  * [cert] - 设备证书 `string | Buffer | Array<string | Buffer>`  
  * [mqttOptions] - MQTT协议专属连接参数，包含如下内容：
    * [connectionTimeout] - 最长等待连接的时间 `Number`，单位为秒，默认30s
    * [reconnectPeriod] - 重连的间隔时间 `Number`，单位为秒，默认3s（每3s重连一次）；如果设为0，则表示关闭重连机制
    * [keepAlive] - `Number` 单位为秒，默认60s;  如果设置为0，则表示关闭keepAlive机制

**示例**

```javascript
const clientOptions = {
  brokerUrl: 'tcp/ssl:{host}:{port}',
  secureCode: SECURE_MODE.VIA_DEVICE_SECRET,
  productKey: '', deviceKey: '', deviceSecret: '',
  mqttOptions: {
    connectionTimeout: 30,
    reconnectPeroid: 0, // 关闭重连机制
    keepAlive: 0 // 关闭keepAlive机制
  }
}
const client = new MqttDeviceClient(clientOptions);
```

---

#### 实例属性

**connected**  `boolean`

标识是否处于连接状态；首次连接和重连场景，值都为`true`；断开连接，值为`false`

**reconnected** `boolean`

标识设备是否已经重连; 首次连接时为`false`

---

#### Events

##### Event `'connect'`

```javascript
client.on('connect', () => { console.log('connected') });
```

连接（重连）成功时触发

##### Event `'close'`

```javascript
client.on('close', () => { console.log('connection is disconnected') });
```

断开连接时触发；异常断开或者手动断开都会触发

如果建立连接时` reconnectPeriod`不为0，且非用户手动关闭连接，则会在触发`close`事件后自动重连

##### Event `'message'`

```javascript
client.on('message', (topic, message) => {
  console.log(`${topic}:${message}`);
})
```

当收到云端指令或消息回执时触发

* topic - `string` 收到的消息topic
* message - `Buffer` 收到的消息payload

##### Event `'error'`

```javascript
client.on('error', (err) => { console.log('err: ', err); })
```

当有解析错误或连接异常时触发

注意：由于nodejs的event机制，如果未监听error事件，当出现错误时会throw一个error，未try catch会导致程序终止，建议error事件需要监听

> Node.js对于error处理的解释： 
>
> When an error occurs within an EventEmitter instance, the typical action is for an 'error' event to be emitted. These are treated as special cases within Node.js. If an EventEmitter does not have at least one listener registered for the 'error' event, and an 'error' event is emitted, the error is thrown, a stack trace is printed, and the Node.js process exits. 
>
> [Error Event](https://nodejs.org/api/events.html#events_error_events)

---

#### 实例方法

##### open()

```typescript
function open(): Promise<string>
```

和云端建立连接; 连接成功后，会触发`connect`事件

设备端与云端建连有3种认证方式，分别对应[Constructor](#constructor)中`clientOptions`不同的参数值：

1. 基于秘钥的静态单向认证

   `brokerUrl`为tcp协议，`secureMode`值为`SECURE_MODE.VIA_DEVICE_SECRET`

   `productKey、deviceKey、deviceSecret`必传

2. 基于秘钥的动态单向认证
   `brokerUrl`为tcp协议，`secureMode`值为`SECURE_MODE.VIA_PRODUCT_SECRET`
   `productKey、deviceKey、productSecret`必传

3. 基于证书的双向认证
   `brokerUrl`为ssl协议，`secureMode`值为`SECURE_MODE.VIA_DEVICE_SECRET`
   `productKey、deviceKey、deviceSecret`必传
   `pfx`或者`key/cert`二选一传递

**返回值**

Promise\<string>

* deviceSecret - `string` 设备秘钥（主要用于动态激活认证方式）

**示例**

```javascript
client.open()
  .then(deviceSecret => {
    console.log('deviceSecret: ', deviceSecret);
  })
  .catch(err => {
		console.log('err: ', err);
  })
```

---

##### close()

```typescript
function close(): Promise<void>
```

和云端断开连接；断开后，会触发`close`事件

**示例**

```javascript
client.close()
	.then(() => {
		console.log('connection closed')
  })
	.catch(err => {
  	console.log('err: ', err);
	})
```

---

#### 设备数据上报相关实例方法

设备数据上报相关的方法挂载在属性`deviceData`下，这些方法有公用的请求参数和返回值

下面的方法详解中，请求参数会省略掉公用请求参数部分，返回值只会注解有差异的`data`部分

<a name='upstreamRequest'></a>

##### 公用请求参数

 * [deviceInfo] - `DeviceInfo` 子设备信息，用于网关设备指定子设备
 * [qos] - `number` qos级别，目前只支持 `0 | 1`
 * [needReply] - `boolean` 标识是否需要等待云端返回，默认为`true`

<a name='upstreamResponse'></a>

 ##### 公用返回值 

* response - `UpstreamResponse` 返回值对象
  * id - `string` 请求id

   * code - `number` 结果返回码，`200`代表请求成功执行
   * data - `object | string | void` 返回的详细信息；会在各方法中详细注解
   * [message] - `string` code非`200`时对应的异常信息提示

---

<a name='queryTag'></a>

##### deviceData#queryTag(queryParams)

```typescript
function queryTag(queryParams: Object): Promise<UpstreamResponse>
```

查询设备标签信息

**参数**

* [queryParams] - `Object` 查询参数
  * [tagKeys] - `string[]` 标签键值列表
  * [公用参数](#upstreamRequest)

**返回值**

> 返回结构体UpstreamResponse请查阅[公用返回值格式](#upstreamResponse)

* data - `{key: value}` 标签键值对

  ```javascript
  { key1: 'value1', key2: 'value2' }
  ```

**示例**

```javascript
client.deviceData.queryTag()
  .then(response => {
    console.log(response.code, response.data);
  })
  .catch(err => {
    console.log('err: ', err);
  })
```

---

<a name='updateTag'></a>

##### deviceData.updateTag(updateParams)

```typescript
function updateTag(updateParams: Object): Promise<UpstreamResponse>
```

上报标签信息

**参数**

* updateParams - `Object`
  * tags - `{tagKey: string, tagValue: string}[]`  待上报的标签列表
  * [公用参数](#upstreamRequest)

**返回值**

> 返回结构体UpstreamResponse请查阅[公用返回值格式](#upstreamResponse)

* data - `string` 更新成功后返回字符串'1'

**示例**

```javascript
const updateTagResponse = await client.deviceData.updateTag({
  tags: [
    {tagKey: 'test', tagValue2: 'aaaaa'},
    {tagKey: 'waitingDelete', tagValue2: 'delete'}
  ]
});
```

---

<a name='deleteTag'></a>

##### deviceData#deleteTag(deleteParams)

```typescript
function deleteTag(deleteParams: Object): Promise<UpstreamResponse>
```

删除标签信息

**参数**

deleteParams - `Object`

* tagKeys - `string[]`  待删除的标签key值列表
* [公用参数](#upstreamRequest)

**返回值**

> 返回结构体UpstreamResponse请查阅[公用返回值格式](#upstreamResponse)

* data - `string` 更新成功后返回字符串'1'

**示例**

```javascript
const deleteTagResponse = await client.deviceData.deleteTag({
  tagKeys: ['waitingDelete']
});
```

---

<a name='queryAttribute'></a>

##### deviceData#queryAttribute(queryParams)

```typescript
function queryAttribute(queryParams: Object): Promise<UpstreamResponse>
```

获取属性信息

**参数**

[queryParams] - `Object`

* [attributeIds] - `string[]`  待查询的属性标识符列表
* [公用参数](#upstreamRequest)

**返回值**

> 返回结构体UpstreamResponse请查阅[公用返回值格式](#upstreamResponse)

* data - `Object` 获取到的属性map； 比如`{age: 30}`

**示例**

```javascript
const deleteTagResponse = await client.deviceData.deleteTag({
  tagKeys: ['waitingDelete']
});
```

---

##### deviceData#updateAttribute(updateParams)

```typescript
function updateAttribute(updateParams: Object): Promise<UpstreamResponse>
```

上报属性信息

**参数**

updateParams - `Object`

* tagKeys - `string[]`  待删除的标签key值列表
* [公用参数](#公用请求参数)

**返回值**

> 返回结构体UpstreamResponse请查阅[公用返回值格式](#upstreamResponse)

* data - `string` 更新成功后返回字符串'1'

**示例**

```javascript
const deleteTagResponse = await client.deviceData.deleteTag({
  tagKeys: ['waitingDelete']
});
```

---

##### deviceData#deleteTag(deleteParams)

```typescript
function deleteTag(deleteParams: Object): Promise<UpstreamResponse>
```

删除标签信息

**参数**

deleteParams - `Object`

* tagKeys - `string[]`  待删除的标签key值列表
* [公用参数](#公用请求参数)

**返回值**

> 返回结构体UpstreamResponse请查阅[公用返回值格式](#upstreamResponse)

* data - `string` 更新成功后返回字符串'1'

**示例**

```javascript
const deleteTagResponse = await client.deviceData.deleteTag({
  tagKeys: ['waitingDelete']
});
```

---

##### deviceData#deleteTag(deleteParams)

```typescript
function deleteTag(deleteParams: Object): Promise<UpstreamResponse>
```

删除标签信息

**参数**

deleteParams - `Object`

* tagKeys - `string[]`  待删除的标签key值列表
* [公用参数](#公用请求参数)

**返回值**

> 返回结构体UpstreamResponse请查阅[公用返回值格式](#upstreamResponse)

* data - `string` 更新成功后返回字符串'1'

**示例**

```javascript
const deleteTagResponse = await client.deviceData.deleteTag({
  tagKeys: ['waitingDelete']
});
```

---

##### deviceData#deleteTag(deleteParams)

```typescript
function deleteTag(deleteParams: Object): Promise<UpstreamResponse>
```

删除标签信息

**参数**

deleteParams - `Object`

* tagKeys - `string[]`  待删除的标签key值列表
* [公用参数](#公用请求参数)

**返回值**

> 返回结构体UpstreamResponse请查阅[公用返回值格式](#upstreamResponse)

* data - `string` 更新成功后返回字符串'1'

**示例**

```javascript
const deleteTagResponse = await client.deviceData.deleteTag({
  tagKeys: ['waitingDelete']
});
```

---

##### deviceData#deleteTag(deleteParams)

```typescript
function deleteTag(deleteParams: Object): Promise<UpstreamResponse>
```

删除标签信息

**参数**

deleteParams - `Object`

* tagKeys - `string[]`  待删除的标签key值列表
* [公用参数](#公用请求参数)

**返回值**

> 返回结构体UpstreamResponse请查阅[公用返回值格式](#upstreamResponse)

* data - `string` 更新成功后返回字符串'1'

**示例**

```javascript
const deleteTagResponse = await client.deviceData.deleteTag({
  tagKeys: ['waitingDelete']
});
```

---

##### deviceData#deleteTag(deleteParams)

```typescript
function deleteTag(deleteParams: Object): Promise<UpstreamResponse>
```

删除标签信息

**参数**

deleteParams - `Object`

* tagKeys - `string[]`  待删除的标签key值列表
* [公用参数](#公用请求参数)

**返回值**

> 返回结构体UpstreamResponse请查阅[公用返回值格式](#upstreamResponse)

* data - `string` 更新成功后返回字符串'1'

**示例**

```javascript
const deleteTagResponse = await client.deviceData.deleteTag({
  tagKeys: ['waitingDelete']
});
```

---

##### deviceData#deleteTag(deleteParams)

```typescript
function deleteTag(deleteParams: Object): Promise<UpstreamResponse>
```

删除标签信息

**参数**

deleteParams - `Object`

* tagKeys - `string[]`  待删除的标签key值列表
* [公用参数](#公用请求参数)

**返回值**

> 返回结构体UpstreamResponse请查阅[公用返回值格式](#upstreamResponse)

* data - `string` 更新成功后返回字符串'1'

**示例**

```javascript
const deleteTagResponse = await client.deviceData.deleteTag({
  tagKeys: ['waitingDelete']
});
```

---

##### deviceData#deleteTag(deleteParams)

```typescript
function deleteTag(deleteParams: Object): Promise<UpstreamResponse>
```

删除标签信息

**参数**

deleteParams - `Object`

* tagKeys - `string[]`  待删除的标签key值列表
* [公用参数](#公用请求参数)

**返回值**

> 返回结构体UpstreamResponse请查阅[公用返回值格式](#upstreamResponse)

* data - `string` 更新成功后返回字符串'1'

**示例**

```javascript
const deleteTagResponse = await client.deviceData.deleteTag({
  tagKeys: ['waitingDelete']
});
```

---

##### deviceData#deleteTag(deleteParams)

```typescript
function deleteTag(deleteParams: Object): Promise<UpstreamResponse>
```

删除标签信息

**参数**

deleteParams - `Object`

* tagKeys - `string[]`  待删除的标签key值列表
* [公用参数](#公用请求参数)

**返回值**

> 返回结构体UpstreamResponse请查阅[公用返回值格式](#upstreamResponse)

* data - `string` 更新成功后返回字符串'1'

**示例**

```javascript
const deleteTagResponse = await client.deviceData.deleteTag({
  tagKeys: ['waitingDelete']
});
```

---

#### MqttGatewayClient
