### TagUI nodered nodes

Easy wrapper for executing TagUI Scripts. Requires chrome to already be installed.

Check the headless option if run from inside docker or as a service.

Does not support running as root.

Node has 3 output nodes.
The top output node is used to continue the flow, once TagUI is done processing. msg.payload will contain all the output from the script
The second output node will receive all output from TagUI live. Use full for debugging
The last output node will trigger incase TagUI returns a non zero exit code, ie an error happend

![example](C:\openiap\node-red-contrib-tagui\example.png)

requires [node-red-contrib-image-output](https://flows.nodered.org/node/node-red-contrib-image-output) for image result

```json
[{"id":"f3af1605.ec32f8","type":"inject","z":"de12dee8.377a1","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":140,"y":80,"wires":[["7dd22cb.07c64d4"]]},{"id":"7dd22cb.07c64d4","type":"tagui tagui","z":"de12dee8.377a1","name":"","headless":false,"script":"https://www.google.dk/imghp?hl=en&ogbl\ntype q as cute kitten[enter]\nwait 2 sec\nif present('//div[@data-ri=\"0\"]')\n    snap //div[@data-ri=\"0\"] to kitten.png\nelse if present('//table//img')\n    snap //table//img to kitten.png","x":270,"y":80,"wires":[["b70aac26.17577"],[],[]]},{"id":"db71650e.26fae8","type":"image","z":"de12dee8.377a1","name":"","width":"160","data":"payload","dataType":"msg","thumbnail":false,"active":true,"pass":false,"outputs":0,"x":440,"y":100,"wires":[]},{"id":"b70aac26.17577","type":"file in","z":"de12dee8.377a1","name":"","filename":"kitten.png","format":"","chunk":false,"sendError":false,"encoding":"none","x":420,"y":60,"wires":[["db71650e.26fae8"]]}]
```


This node will detect if TagUI exists in the home folder, and if not download and extract it.