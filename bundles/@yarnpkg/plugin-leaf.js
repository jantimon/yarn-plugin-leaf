/* eslint-disable */
module.exports = {
name: "@yarnpkg/plugin-leaf",
factory: function (require) {
var plugin;(()=>{"use strict";var e={d:(a,t)=>{for(var o in t)e.o(t,o)&&!e.o(a,o)&&Object.defineProperty(a,o,{enumerable:!0,get:t[o]})},o:(e,a)=>Object.prototype.hasOwnProperty.call(e,a),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},a={};e.r(a),e.d(a,{default:()=>p});const t=require("@yarnpkg/shell"),o=require("@yarnpkg/cli"),s=require("@yarnpkg/core"),n=require("clipanion"),r=require("@yarnpkg/fslib"),i=async e=>{const{leafModules:a}=e.manifest.raw;if(!Array.isArray(a))return[];const t=await Promise.all(a.map(a=>l(a,e.cwd)));return Promise.all(t.flat())},l=async(e,a)=>(await t.globUtils.match(e+"/package.json",{cwd:a,baseFs:r.xfs})).map(e=>r.ppath.resolve(a,e,"..")).map(async e=>{const a=s.Manifest.fromFile(r.ppath.join(e,"package.json"));let t;try{t=await r.xfs.statPromise(r.ppath.join(e,"node_modules"))}catch(e){}return{manifest:await a,hasNodeModules:Boolean(t),absolutePath:e}});class c extends o.BaseCommand{async execute(){const e=await s.Configuration.find(this.context.cwd,this.context.plugins),{project:a,workspace:t}=await s.Project.find(e,this.context.cwd);if(!t)throw new o.WorkspaceRequiredError(a.cwd,this.context.cwd);return(await s.StreamReport.start({configuration:e,stdout:this.context.stdout},async a=>{const o=await i(t),n=o.length,r=o.filter(({hasNodeModules:e})=>e),l=o.filter(({hasNodeModules:e})=>!e),{Cross:c,Check:d}=s.formatUtils.mark(e),m=e=>a.reportInfo(s.MessageName.UNNAMED,e);if(m(`This workspace contains ${n} leaf module${1===n?"":"s"}.`),m(""),r.length){const e=r.length;m(`The following ${1===e?"leaf module is":e+" leaf modules are"} active:`),r.forEach(e=>m(`${d} ${e.manifest.name.name}`)),m("")}if(l.length){const e=l.length;m(`The following ${1===e?"leaf module is":e+" leaf modules are"} inactive:`),l.forEach(e=>m(`${c} ${e.manifest.name.name}`)),m("")}})).exitCode()}}c.paths=[["leaf"]],c.usage=n.Command.Usage({description:"leaf workspace modules",details:"\n      This command allows to install modules which are excluded from the ordinary installation.\n    ",examples:[["Activate a leaf workspace","yarn leaf activate @tools/git-hooks"],["Disable a leaf workspace","yarn leaf disable @tools/git-hooks"],["View all leaf workspaces","yarn leaf"]]});class d extends o.BaseCommand{constructor(){super(...arguments),this.patterns=n.Option.Rest()}async execute(){const e=await s.Configuration.find(this.context.cwd,this.context.plugins),{project:a,workspace:n}=await s.Project.find(e,this.context.cwd);if(!n)throw new o.WorkspaceRequiredError(a.cwd,this.context.cwd);const r=await s.StreamReport.start({configuration:e,stdout:this.context.stdout},async()=>{}),l=await i(n);return await Promise.all(this.patterns.map(async a=>{const o=l.find(e=>e.manifest.name.name===a);o?(o.hasNodeModules||await(0,t.execute)("yarn",[],{cwd:o.absolutePath}),r.reportInfo(s.MessageName.UNNAMED,s.formatUtils.pretty(e,`leaf '${a}' has been activated`,"green"))):r.reportError(s.MessageName.UNNAMED,s.formatUtils.pretty(e,`Could not find leaf '${a}'`,"red"))})),r.exitCode()}}d.paths=[["leaf","activate"]],d.usage=n.Command.Usage({description:"install leaf workspace modules",details:"\n      This command allows to install modules which are excluded from the ordinary installation.\n    ",examples:[["Activate a leaf workspace","yarn leaf activate @tools/git-hooks"]]});class m extends o.BaseCommand{constructor(){super(...arguments),this.patterns=n.Option.Rest()}async execute(){const e=await s.Configuration.find(this.context.cwd,this.context.plugins),{project:a,workspace:t}=await s.Project.find(e,this.context.cwd);if(!t)throw new o.WorkspaceRequiredError(a.cwd,this.context.cwd);const n=await s.StreamReport.start({configuration:e,stdout:this.context.stdout},async()=>{}),l=await i(t);return await Promise.all(this.patterns.map(async a=>{const t=l.find(e=>e.manifest.name.name===a);t?(t.hasNodeModules&&await r.xfs.removePromise(r.ppath.join(t.absolutePath,"node_modules"),{recursive:!0}),n.reportInfo(s.MessageName.UNNAMED,s.formatUtils.pretty(e,`leaf '${a}' has been disabled`,"green"))):n.reportError(s.MessageName.UNNAMED,s.formatUtils.pretty(e,`Could not find leaf '${a}'`,"red"))})),n.exitCode()}}m.paths=[["leaf","disable"]],m.usage=n.Command.Usage({description:"uninstall leaf workspace modules",details:"\n      This command allows to uninstall modules which are excluded from the ordinary installation.\n    ",examples:[["Disable a leaf workspace","yarn leaf disable @tools/git-hooks"]]});
/*!
 * Yarn Leaf Plugin
 * https://github.com/jantimon/yarn-plugin-leaf
 *
 * The `yarn-plugin-leaf` plugin adds `leaf` modules. Leaf modules are standalone
 * modules with a standalone package.json and yarn.lock file.
 *
 * In contrast to workspace modules leaf modules and all of their dependencies are only
 * installed on demand.
 *
 * List existing leafs
 *
 * ```
 *   yarn leaf
 * ```
 *
 * Activate a leaf module and install all it's dependencies:
 *
 * ```
 *   yarn leaf activate my-special-package
 * ```
 *
 * Disable a leaf module and uninstall all it's dependencies:
 *
 * ```
 *   yarn leaf disable my-special-package
 * ```
 *
 * Updates of all active leaf modules will run automatically
 * during your normal yarn install run
 *
 * ```
 *   yarn
 * ```
 *
 * Update the `yarn leaf` module:
 * ```
 *   yarn plugin import https://raw.githubusercontent.com/jantimon/yarn-plugin-leaf/main/bundles/%40yarnpkg/plugin-leaf.js
 * ```
 */
const f=new WeakMap,p={commands:[c,d,m],hooks:{validateWorkspace(e){const a=f.get(e.project),o=a||[];a||f.set(e.project,o),o.push(i(e).then(async e=>Promise.all(e.map(async e=>{const{manifest:a,hasNodeModules:o,absolutePath:s}=await e;return o?(await(0,t.execute)("yarn",[],{cwd:s}),"✨ Updated "+a.raw.name):"Skipping "+a.raw.name}))))},afterAllInstalled:async e=>{const a=f.get(e);if(a){(await Promise.all(a)).forEach(e=>e.forEach(e=>{console.log(e)}))}}}};plugin=a})();
return plugin;
}
};