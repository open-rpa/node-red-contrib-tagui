"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
module.exports = function (RED) {
    class tagui_tagui {
        constructor(config) {
            this.config = config;
            this.node = null;
            this.name = "";
            RED.nodes.createNode(this, config);
            this.node = this;
            this.node.status({});
            this.node.on("input", this.oninput);
        }
        async oninput(msg) {
            var e_1, _a;
            try {
                this.node.status({});
                const headless = msg.headless || this.config.headless;
                const nobrowser = msg.nobrowser || this.config.nobrowser;
                const param = msg.param || this.config.param;
                const quiet = msg.quiet || this.config.quiet;
                const script = msg.script || this.config.script;
                const updatecheck = msg.updatecheck || this.config.updatecheck;
                const { spawn, execSync, spawnSync } = require('child_process');
                const fs = require('fs');
                const path = require('path');
                const os = require('os');
                const anzip = require('anzip');
                const http = require('follow-redirects').https;
                var download = async function (url, dest) {
                    return new Promise((resolve, reject) => {
                        var file = fs.createWriteStream(dest);
                        http.get(url, function (response) {
                            response.pipe(file);
                            file.on('finish', () => {
                                file.close(() => {
                                    resolve();
                                });
                            });
                        });
                    });
                };
                const homedir = os.homedir();
                const taguidir = path.resolve(homedir, 'tagui');
                const tagerina = (process.platform == 'win32' ? path.resolve(homedir, 'tagui/src/erina.cmd') : path.resolve(homedir, 'tagui/src/erina'));
                const taguiexe = (process.platform == 'win32' ? path.resolve(homedir, 'tagui/src/tagui.cmd') : path.resolve(homedir, 'tagui/src/tagui'));
                const taguiendexe = (process.platform == 'win32' ? path.resolve(homedir, 'tagui/src/end_processes.cmd') : path.resolve(homedir, 'tagui/src/end_processes'));
                if (!fs.existsSync(taguidir) || !fs.existsSync(taguiexe)) {
                    let filename = path.resolve(homedir, 'TagUI_Windows.zip');
                    let url = "https://github.com/kelaberetiv/TagUI/releases/download/v6.46.0/TagUI_Windows.zip";
                    if (process.platform == 'darwin') {
                        filename = path.resolve(homedir, 'TagUI_macOS.zip');
                        url = "https://github.com/kelaberetiv/TagUI/releases/download/v6.46.0/TagUI_macOS.zip";
                    }
                    else if (process.platform != 'win32') {
                        filename = path.resolve(homedir, 'TagUI_Linux.zip');
                        url = "https://github.com/kelaberetiv/TagUI/releases/download/v6.46.0/TagUI_Linux.zip";
                    }
                    if (!fs.existsSync(filename)) {
                        this.node.status({ fill: "blue", shape: "dot", text: "Download TagUI" });
                        this.node.warn('Download TagUI Zipfile');
                        await download(url, filename);
                    }
                    this.node.status({ fill: "blue", shape: "dot", text: "Extracting TagUI" });
                    this.node.warn('Extracting TagUI');
                    await anzip(filename, { outputPath: homedir });
                    fs.unlinkSync(filename);
                    if (process.platform != 'win32') {
                        fs.chmodSync(taguiexe, '755');
                        fs.chmodSync(taguiendexe, '755');
                        fs.chmodSync(tagerina, '755');
                    }
                }
                fs.writeFileSync("robot.tag", script);
                let _arguments = ["robot.tag"];
                if (quiet) {
                    _arguments.push("-quiet");
                }
                if (headless) {
                    _arguments.push("-headless");
                }
                else if (nobrowser) {
                    _arguments.push("-nobrowser");
                }
                const stringify = (element) => {
                    var result = element;
                    if (element != null && typeof element !== 'string') {
                        result = element.toString();
                    }
                    if (result.indexOf(' ') && !result.startsWith('"') && !result.endsWith('"')) {
                        // result = '"' + result + '"';
                    }
                    return result;
                };
                if (param) {
                    if (msg.payload.indexOf(' ') > -1) {
                        msg.payload = msg.payload.split(' ');
                    }
                    if (Array.isArray(msg.payload)) {
                        msg.payload.forEach((element, index) => {
                            msg.payload[index] = stringify(element);
                        });
                        _arguments = _arguments.concat(msg.payload);
                    }
                    else {
                        _arguments.push(stringify(msg.payload));
                    }
                }
                if (updatecheck) {
                    execSync(taguiendexe);
                    spawnSync(taguiexe, ["update"]);
                }
                execSync(taguiendexe);
                this.node.status({ fill: "blue", shape: "dot", text: "Spawn TagUI" });
                const child = spawn(taguiexe, _arguments);
                let output = [];
                // child.stdout.pipe(process.stdout);
                child.on('exit', code => {
                    msg.command = taguiexe;
                    msg.arguments = _arguments;
                    msg.payload = output;
                    if (code == 0) {
                        this.node.send(msg);
                        this.node.status({ fill: "green", shape: "dot", text: "completed" });
                    }
                    else {
                        msg.exitcode = code;
                        this.node.send([, , msg]);
                        if (output && output.length > 0 && output[0].startsWith("ERROR")) {
                            this.node.status({ fill: "red", shape: "dot", text: output[0].substr(6, 32) });
                        }
                        else {
                            this.node.status({ fill: "red", shape: "dot", text: "failed " + code });
                        }
                    }
                });
                try {
                    for (var _b = __asyncValues(child.stdout), _c; _c = await _b.next(), !_c.done;) {
                        const data = _c.value;
                        let datastr = data.toString();
                        if (datastr.endsWith('\n'))
                            datastr = datastr.substr(0, datastr.length - 1);
                        if (datastr.endsWith('\r'))
                            datastr = datastr.substr(0, datastr.length - 1);
                        if (datastr.trim() != "") {
                            output.push(datastr);
                            msg.payload = datastr;
                            this.node.status({ fill: "blue", shape: "dot", text: datastr.substr(0, 32) });
                            this.node.send([, msg]);
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                ;
            }
            catch (error) {
                this.HandleError(this, error, msg);
                var stdout = "";
                if (error.stdout) {
                    stdout = error.stdout.toString();
                    this.node.warn(`TagUI: ${stdout}`);
                }
                var stderr = "";
                if (error.stderr) {
                    stderr = error.stderr.toString();
                    this.node.warn(`TagUI: ${stderr}`);
                }
            }
        }
        HandleError(node, error, msg) {
            console.error(error);
            var message = error;
            try {
                if (typeof error === 'string' || error instanceof String) {
                    error = new Error(error);
                }
                node.error(error, msg);
            }
            catch (error) {
                console.error(error);
            }
            try {
                if (message === null || message === undefined || message === "") {
                    message = "";
                }
                node.status({ fill: "red", shape: "dot", text: message.toString().substr(0, 32) });
            }
            catch (error) {
                console.error(error);
            }
        }
    }
    RED.nodes.registerType("tagui tagui", tagui_tagui);
};
//# sourceMappingURL=tagui.js.map