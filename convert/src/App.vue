<script setup lang="ts">
import zip from 'jszip';
import yaml from 'js-yaml';
import { packSkin } from './utils/skins';
import JSZip from 'jszip';
import { packEffect } from './utils/effects';

// var loadList = {
//   "favicon.jpg": "/src/assets/favicon.jpg",
//   "JUDGMENT_LINE.png": "/src/assets/skins/JUDGMENT_LINE.png",
//   "NOTE_CONNECTION_BLUE.png": "/src/assets/skins/NOTE_CONNECTION_BLUE.png",
//   "NOTE_CONNECTION_YELLOW.png": "/src/assets/skins/NOTE_CONNECTION_YELLOW.png",
//   "NOTE_HEAD_BLUE.png": "/src/assets/skins/NOTE_HEAD_BLUE.png",
//   "NOTE_HEAD_CYAN.png": "/src/assets/skins/NOTE_HEAD_CYAN.png",
//   "NOTE_HEAD_RED.png": "/src/assets/skins/NOTE_HEAD_RED.png",
//   "NOTE_HEAD_YELLOW.png": "/src/assets/skins/NOTE_HEAD_YELLOW.png",
//   "NOTE_TAIL_BLUE.png": "/src/assets/skins/NOTE_TAIL_BLUE.png",
//   "NOTE_TAIL_CYAN.png": "/src/assets/skins/NOTE_TAIL_CYAN.png",
//   "NOTE_TAIL_RED.png": "/src/assets/skins/NOTE_TAIL_RED.png",
//   "NOTE_TAIL_YELLOW.png": "/src/assets/skins/NOTE_TAIL_YELLOW.png",
//   "0.png": "/src/assets/skins/0.png",
//   "1.png": "/src/assets/skins/1.png",
//   "2.png": "/src/assets/skins/2.png",
//   "3.png": "/src/assets/skins/3.png",
//   "4.png": "/src/assets/skins/4.png",
//   "5.png": "/src/assets/skins/5.png",
//   "6.png": "/src/assets/skins/6.png",
//   "7.png": "/src/assets/skins/7.png",
//   "8.png": "/src/assets/skins/8.png",
//   "9.png": "/src/assets/skins/9.png",
//   "Blocker.png": "/src/assets/skins/Blocker.png",
//   "combo.png": "/src/assets/skins/combo.png",
//   "Judgeline AllPerfect.png": "/src/assets/skins/Judgeline AllPerfect.png",
//   "Judgeline FullCombo.png": "/src/assets/skins/Judgeline FullCombo.png",
//   "Pause.png": "/src/assets/skins/Pause.png",
//   "PERFECT.mp3": "/src/assets/effects/PERFECT.mp3",
//   "PERFECT_ALTERNATIVE.mp3": "/src/assets/effects/PERFECT_ALTERNATIVE.mp3",
//   "HOLD.mp3": "/src/assets/effects/HOLD.mp3",
//   "Phigros Tick.mp3": "/src/assets/effects/Phigros Tick.mp3",
//   "ffmpeg-core.js": "/ffmpeg-core.js",
//   "ffmpeg-core.wasm": "/ffmpeg-core.wasm",
// };

var loadList = {
  "favicon.jpg": new URL("/src/assets/favicon.jpg", import.meta.url).href,
  "JUDGMENT_LINE.png": new URL("/src/assets/skins/JUDGMENT_LINE.png", import.meta.url).href,
  "NOTE_CONNECTION_BLUE.png": new URL("/src/assets/skins/NOTE_CONNECTION_BLUE.png", import.meta.url).href,
  "NOTE_CONNECTION_YELLOW.png": new URL("/src/assets/skins/NOTE_CONNECTION_YELLOW.png", import.meta.url).href,
  "NOTE_HEAD_BLUE.png": new URL("/src/assets/skins/NOTE_HEAD_BLUE.png", import.meta.url).href,
  "NOTE_HEAD_CYAN.png": new URL("/src/assets/skins/NOTE_HEAD_CYAN.png", import.meta.url).href,
  "NOTE_HEAD_RED.png": new URL("/src/assets/skins/NOTE_HEAD_RED.png", import.meta.url).href,
  "NOTE_HEAD_YELLOW.png": new URL("/src/assets/skins/NOTE_HEAD_YELLOW.png", import.meta.url).href,
  "NOTE_TAIL_BLUE.png": new URL("/src/assets/skins/NOTE_TAIL_BLUE.png", import.meta.url).href,
  "NOTE_TAIL_CYAN.png": new URL("/src/assets/skins/NOTE_TAIL_CYAN.png", import.meta.url).href,
  "NOTE_TAIL_RED.png": new URL("/src/assets/skins/NOTE_TAIL_RED.png", import.meta.url).href,
  "NOTE_TAIL_YELLOW.png": new URL("/src/assets/skins/NOTE_TAIL_YELLOW.png", import.meta.url).href,
  "0.png": new URL("/src/assets/skins/0.png", import.meta.url).href,
  "1.png": new URL("/src/assets/skins/1.png", import.meta.url).href,
  "2.png": new URL("/src/assets/skins/2.png", import.meta.url).href,
  "3.png": new URL("/src/assets/skins/3.png", import.meta.url).href,
  "4.png": new URL("/src/assets/skins/4.png", import.meta.url).href,
  "5.png": new URL("/src/assets/skins/5.png", import.meta.url).href,
  "6.png": new URL("/src/assets/skins/6.png", import.meta.url).href,
  "7.png": new URL("/src/assets/skins/7.png", import.meta.url).href,
  "8.png": new URL("/src/assets/skins/8.png", import.meta.url).href,
  "9.png": new URL("/src/assets/skins/9.png", import.meta.url).href,
  "Blocker.png": new URL("/src/assets/skins/Blocker.png", import.meta.url).href,
  "combo.png": new URL("/src/assets/skins/combo.png", import.meta.url).href,
  "Judgeline AllPerfect.png": new URL("/src/assets/skins/Judgeline AllPerfect.png", import.meta.url).href,
  "Judgeline FullCombo.png": new URL("/src/assets/skins/Judgeline FullCombo.png", import.meta.url).href,
  "Pause.png": new URL("/src/assets/skins/Pause.png", import.meta.url).href,
  "PERFECT.mp3": new URL("/src/assets/effects/PERFECT.mp3", import.meta.url).href,
  "PERFECT_ALTERNATIVE.mp3": new URL("/src/assets/effects/PERFECT_ALTERNATIVE.mp3", import.meta.url).href,
  "HOLD.mp3": new URL("/src/assets/effects/HOLD.mp3", import.meta.url).href,
  "Phigros Tick.mp3": new URL("/src/assets/effects/Phigros Tick.mp3", import.meta.url).href,
  "ffmpeg-core.js": new URL("/ffmpeg-core.js", import.meta.url).href,
  "ffmpeg-core.wasm": new URL("/ffmpeg-core.wasm", import.meta.url).href,
};

var isLoading = true;
function handleDrop(e) {
  if (isLoading) return;
  e.preventDefault();
  const files = e.dataTransfer.files;
  convertFile(files[0]);
}
function handleDragOver(e) {
  if (isLoading) return;
  e.preventDefault();
}
function handleClick(e) {
  if (isLoading) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = ".zip"
  input.onchange = (e) => {
    const files = e.target.files;
    convertFile(files[0]);
  };
  input.click();
}
async function convertFile(file) {
  document.getElementById("text").innerText = "Converting...";
  zip.loadAsync(file).then(async (zip) => {
    var newzip: JSZip = new JSZip();
    var obj = yaml.load(await zip.file("info.yml").async("string"));

    var items = {
      levels: [],
      skins: [],
      backgrounds: [],
      effects: [],
      particles: [],
      engines: [],
      replays: [],
      posts: [],
      playlists: []
    }
    
    items.skins.push(await packSkin(newzip, zip, loadList));
    items.effects.push(await packEffect(newzip, zip, loadList));

    for (var key in items) {
      for (var i = 0; i < items[key].length; i++) {
        newzip.file("sonolus/" + key + "/" + items[key][i].name, JSON.stringify({
          item: items[key][i],
          description: obj["description"] == undefined ? "" : obj["description"],
          hasCommunity: false,
          leaderboards: [],
          sections: []
        }));
      }
      newzip.file("sonolus/" + key + "/info", JSON.stringify({
        sections: [{
          title: "#NEWEST",
          items: items[key]
        }]
      }));
      newzip.file("sonolus/" + key + "/list", JSON.stringify({
        pageCount: 1,
        items: items[key]
      }));
    }

    newzip.file("sonolus/package", JSON.stringify({
      shouldUpdate: false
    }));

    newzip.file("sonolus/info", JSON.stringify({
      title: obj["name"],
      description: obj["description"] == undefined ? "" : obj["description"],
      buttons: [
        { type: 'skin' },
        { type: 'effect' },
        { type: 'particle' },
      ],
    }));

    newzip.generateAsync({ type: "blob" }).then((blob) => {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = obj["name"] + ".scp";
      a.click();
      document.getElementById("text").innerText = "Downloading...";
    });
  }).catch((e) => alert("Failed to load Phira respack file: " + e));
}

function getSize(size: number): string {
  if (size < 1024) return size + "B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + "KB";
  return (size / 1024 / 1024).toFixed(2) + "MB";
}

async function loadResource() {
  var loaded = 0;
  var total = 0;
  var filesize = {};
  for (var key in loadList) {
    var fileSize = await fetch(loadList[key], { method: 'HEAD' }).then((res) => res.headers.get('content-length'));
    filesize[key] = fileSize;
    total += parseInt(fileSize);
  }
  for (var key in loadList) {
    var current = 0, currentTotal = filesize[key];
    document.getElementById("info-text").innerText = "(" + Math.floor(loaded / total * 100) + "%) Loading \"" + key + "\"(\"" + loadList[key] + "\")...";
    var res = await fetch(loadList[key]);
    var reader = res.body.getReader();
    var data = [];
    while(true) {
      var { done, value } = await reader.read();
      if (done) break;
      data.push(value);
      loaded += value.length;
      current += value.length;
      document.getElementById("info-text").innerText = "(" + Math.floor(loaded / total * 100) + "%) Loading \"" + key + 
        "\"(\"" + loadList[key] + "\", " + getSize(current) + "/" + getSize(currentTotal) + ")...";
      document.getElementById("progress").style.width = (loaded / total * 100) + "%";
    }
    var blob = new Blob(data, { type: res.headers.get('content-type') });
    var url = URL.createObjectURL(blob);
    loadList[key] = url;
  }
  isLoading = false;
  document.getElementById("dropzone").style.cursor = "pointer";
  document.getElementById("info-text").innerText = "(100%) Loading resource finished!";
}

window.onload = loadResource;
</script>

<template>
  <div style="display: block; width: 100%">
    <h1 style="margin: 20px">
      Phira Respack -> Sonolus Collection Package
    </h1>
    <div id="dropzone" @drop="handleDrop" @dragover="handleDragOver" @click="handleClick" style="border: dashed 1px grey; height: 300px; border-radius: 5px; display: flex; display: -webkit-flex; justify-content: center; align-items: center; cursor: not-allowed; flex-direction: column; justify-content: center;">
      <h2 style="width: fit-content">Drag a file here or choose your file</h2>
      <p id="text"></p>
    </div>
    <br/>
    <div>
      <p id="info-text">(0%) Loading resources...</p>
      <div id="progress" style="width: 100%; border-radius: 50px; height: 5px; background-color: grey"></div>
    </div>
    <br/>
    <strong>Hint: </strong>
    <p>1. This tool is designed for <strong style="color: red">Sonolus v0.8.3 beta</strong></p>
    <p>2. The copyright of all resource packages belongs to <strong>the original author</strong>. Please <strong>follow the requirements</strong> set by the original author when using them. If infringement or other issues arise due to disfollowing the original author's requirements, this website and its developer shall not be held responsible, and the user shall bear all responsibility on their own!</p>
    <p>3. If you have any issues when using this tool, welcome to report them to <a href="https://github.com/LittleYang0531/phigros-private/issues">https://github.com/LittleYang0531/phigros-private/issues</a>. I will solve them as quickly as I can.</p>
  </div>
  <img id="test-img" />
</template>

<style scoped>
header {
  line-height: 1.5;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
