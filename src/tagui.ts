// import { Red } from "node-red";

import nodeRed = require("node-red");

// import { anzip } from 'anzip';
export = function (RED: nodeRed.NodeRedApp) {
    interface Itagui_tagui {
        headless: boolean;
        nobrowser: boolean;
        param: boolean;
        quiet: boolean;
        name: string;
        script: string;
        updatecheck: boolean;
    }
    class tagui_tagui {
        public node: any = null;
        public name: string = "";
        public hasphp: boolean = false;
        constructor(public config: Itagui_tagui) {
            (RED as any).nodes.createNode(this, config);
            this.node = this;
            this.node.status({});
            this.node.on("input", this.oninput);

            this.init();
        }
        async init() {
            this.node.status({ fill: "blue", shape: "dot", text: "Checking prerequests" });
            if (process.platform != 'win32') {
                const { execSync } = require('child_process');
                try {
                    const phpOutput = await execSync("php -v");
                    const php = phpOutput.toString() ? phpOutput.toString() : "";
                    if (php.indexOf("rror") === -1) this.hasphp = true;
                } catch (error) {
                    this.node.status({ fill: "red", shape: "dot", text: "php is missing" });
                }
            } else {
                this.hasphp = true;
            }
            this.node.status({});
        }
        sleep(ms) {
            return new Promise(resolve => { setTimeout(resolve, ms) })
        }
        async oninput(msg: any) {
            try {
                if (!this.hasphp) {
                    msg.error = new Error("PHP not found");
                    this.node.send([, , msg]);
                    this.node.status({ fill: "red", shape: "dot", text: "php is missing" });
                    return;
                }
                this.node.status({ fill: "blue", shape: "dot", text: "initializing" });
                await this.sleep(10);
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
                    return new Promise<void>((resolve, reject) => {
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
                }

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
                    } else if (process.platform != 'win32') {
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
                    _arguments.push("-quiet")
                }
                if (headless) {
                    _arguments.push("-headless")
                } else if (nobrowser) {
                    _arguments.push("-nobrowser")
                }
                const stringify = (element) => {
                    var result: string = element
                    if (element != null && typeof element !== 'string') {
                        result = element.toString();
                    }
                    if (result.indexOf(' ') && !result.startsWith('"') && !result.endsWith('"')) {
                        // result = '"' + result + '"';
                    }
                    return result;
                }
                if (param) {
                    if (msg.payload.indexOf(' ') > -1) {
                        msg.payload = msg.payload.split(' ');
                    }
                    if (Array.isArray(msg.payload)) {
                        msg.payload.forEach((element, index) => {
                            msg.payload[index] = stringify(element);
                        });
                        _arguments = _arguments.concat(msg.payload);
                    } else {
                        _arguments.push(stringify(msg.payload));
                    }
                }
                if (updatecheck) {
                    this.node.status({ fill: "blue", shape: "dot", text: "Running update check" });
                    await this.sleep(10);
                    await execSync(taguiendexe);
                    await spawnSync(taguiexe, ["update"]);
                }
                this.node.status({ fill: "blue", shape: "dot", text: "Cleanup" });
                await this.sleep(10);
                await execSync(taguiendexe);

                this.node.status({ fill: "blue", shape: "dot", text: "Spawn TagUI" });
                const child = spawn(taguiexe, _arguments);
                let output: string[] = [];
                // child.stdout.pipe(process.stdout);

                child.on('exit', code => {
                    msg.command = taguiexe;
                    msg.arguments = _arguments;
                    msg.payload = output;
                    var lasterror = "";
                    for (let i = 0; i < output.length; i++) {
                        if (!output[i]) continue;
                        // in case of special charecter we don't use startsWith
                        if (output[i].indexOf("ERROR") > -1 && output[i].indexOf("ERROR") < 5) {
                            lasterror = output[i].substr(6, 32);
                            if (!msg.error || !Array.isArray(msg.error)) msg.error = [];
                            msg.error.push(output[i]);
                        }
                    }
                    if (code !== 0 && lasterror == "") lasterror = "failed " + code;
                    if (lasterror == "") {
                        this.node.send(msg);
                        this.node.status({ fill: "green", shape: "dot", text: "completed" });
                    } else {
                        msg.exitcode = code;
                        this.node.send([, , msg]);
                        this.node.status({ fill: "red", shape: "dot", text: lasterror });
                    }
                    console.log(output);
                });
                for await (const data of child.stdout) {
                    let datastr: string = data.toString();
                    if (datastr.endsWith('\n')) datastr = datastr.substr(0, datastr.length - 1);
                    if (datastr.endsWith('\r')) datastr = datastr.substr(0, datastr.length - 1);
                    if (datastr.trim() != "") {
                        output.push(datastr);
                        msg.payload = datastr;
                        this.node.status({ fill: "blue", shape: "dot", text: datastr.substr(0, 32) });
                        this.node.send([, msg]);
                    }
                };
                for await (const data of child.stderr) {
                    let datastr: string = data.toString();
                    if (datastr.endsWith('\n')) datastr = datastr.substr(0, datastr.length - 1);
                    if (datastr.endsWith('\r')) datastr = datastr.substr(0, datastr.length - 1);
                    if (datastr.trim() != "") {
                        msg.payload = datastr;
                        this.node.status({ fill: "blue", shape: "dot", text: datastr.substr(0, 32) });
                        this.node.send([, msg]);
                        // prefix with error so we can catch it in the exit event too.
                        if (datastr.startsWith("ERROR")) output.push(datastr);
                        if (!datastr.startsWith("ERROR")) output.push("ERROR " + datastr);                        
                    }
                };

            } catch (error) {
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
        public HandleError(node: any, error: any, msg: any): void {
            console.error(error);
            var message: string = error;
            try {
                if (typeof error === 'string' || error instanceof String) {
                    error = new Error(error as string);
                }
                node.error(error, msg);
            } catch (error) {
                console.error(error);
            }
            try {
                if (message === null || message === undefined || message === "") { message = ""; }
                node.status({ fill: "red", shape: "dot", text: message.toString().substr(0, 32) });
            } catch (error) {
                console.error(error);
            }
        }

    }
    (RED.nodes as any).registerType("tagui tagui", (tagui_tagui as any));
}
