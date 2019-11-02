# Run the server locally
```
$> npm install
$> npm run server
```
# Build the docker container
1) Pull down the docker image
```
docker pull conorgil/ws-message-router
```

2) Run the docker image as a container
```
docker run --rm -it -d -p 999:8999 conorgil/ws-message-router
```

3) Get the ID of the running container
```
docker container ls
```

4) Follow the logs of the container for debugging
```
docker logs --follow <container ID>
```

5) Stop the container
```
docker container stop <container ID>
```

# Send websocket request to the server
1) Install the [Smart Websocket Client](https://chrome.google.com/webstore/detail/smart-websocket-client/omalebghpgejjiaoknljcfmglgbpocdp)

2) Connect to `ws://localhost:9999`

3) Send message with the correct format
```
{
  "from": {
    "groupId": "A",
    "deviceId": "2"
  },
  "to": {
    "type": "group",
    "id": "A"
  },
  "data": {
    "type": "SOME_ACTION",
    "msg": "Hello from device 2 in group A!"
  }
}
```