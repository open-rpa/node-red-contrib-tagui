import { Red } from "node-red";
// import { anzip } from 'anzip';
export = function (RED: Red) {
    interface Itagui_tagui {
        headless: boolean;
        name: string;
        script: string;
    }
    class tagui_tagui {
        public node: any = null;
        public name: string = "";
        constructor(public config: Itagui_tagui) {
            (RED as any).nodes.createNode(this, config);
            this.node = this;
            this.node.status({});
            this.node.on("input", this.oninput);
        }
        async oninput(msg: any) {
            try {
                this.node.status({});
                const headless = msg.headless || this.config.headless;
                const script = msg.script || this.config.script;
                const { spawn } = require('child_process');
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
                const taguiexe = (process.platform == 'win32' ? path.resolve(homedir, 'tagui/src/tagui.cmd') : path.resolve(homedir, 'tagui/src/tagui'));
                if (!fs.existsSync(taguidir) || !fs.existsSync(taguiexe)) {
                    let filename = path.resolve(homedir, 'TagUI_Windows.zip');
                    let url = "https://github.com/kelaberetiv/TagUI/releases/download/v6.14.0/TagUI_Windows.zip";
                    if (process.platform == 'darwin') {
                        filename = path.resolve(homedir, 'TagUI_macOS.zip');
                        url = "https://github.com/kelaberetiv/TagUI/releases/download/v6.14.0/TagUI_macOS.zip";
                    } else {
                        filename = path.resolve(homedir, 'TagUI_Linux.zip');
                        url = "https://github.com/kelaberetiv/TagUI/releases/download/v6.14.0/TagUI_Linux.zip";
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
                }
                fs.writeFileSync("robot.tag", script);

                const _arguments = ["robot.tag"];
                if (headless) _arguments.push("-headless")
                this.node.status({ fill: "blue", shape: "dot", text: "Spawn TagUI" });
                const child = spawn(taguiexe, _arguments);
                let output: string = "";
                for await (const data of child.stdout) {
                    let datastr: string = data.toString();
                    output += datastr;
                    if (datastr.endsWith('\n')) datastr = datastr.substr(0, datastr.length - 1);
                    if (datastr.endsWith('\r')) datastr = datastr.substr(0, datastr.length - 1);
                    if (datastr.trim() != "") {
                        msg.payload = datastr;
                        this.node.status({ fill: "blue", shape: "dot", text: datastr.substr(0, 32) });
                        this.node.send([, msg]);
                    }
                };
                child.on('exit', code => {
                    msg.payload = output;
                    if (code == 0) {
                        this.node.send(msg);
                        this.node.status({ fill: "red", shape: "dot", text: "succes" });
                    } else {
                        msg.exitcode = code;
                        this.node.send([, , msg]);
                        this.node.status({ fill: "red", shape: "dot", text: "failed" });
                    }
                });
            } catch (error) {
                this.HandleError(this, error, msg);
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
    RED.nodes.registerType("tagui tagui", (tagui_tagui as any));
}
