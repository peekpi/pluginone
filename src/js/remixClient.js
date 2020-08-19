import { createIframeClient } from "@remixproject/plugin";
const devMode = { port: 443 };
const pluginClient = createIframeClient({ devMode });
//const pluginClient = createIframeClient({});

let solidityCBK = null;

pluginClient.onload().then(() => {
    console.log("onload:");
    pluginClient.solidity.on(
        "compilationFinished",
        (...args)=>solidityCBK && solidityCBK(...args)
    );
});

window.pc = pluginClient;

export function onSolidity(cbk){
    solidityCBK = cbk;
}

export function log(msg){
    console.log("remix-log:", msg);
    pluginClient.emit('log',{data:msg});
}
export function info(msg){
    console.log("remix-info:", msg);
    pluginClient.emit('info',{data:msg});
}
export function warn(msg){
    console.log("remix-warn:", msg);
    pluginClient.emit('warn',{data:msg});
}
export function error(msg){
    console.log("remix-error:", msg);
    pluginClient.emit('error',{data:msg});
}
export function html(outerHTML){
    console.log("remix-html:", outerHTML);
    pluginClient.emit('html',{data:outerHTML});
}