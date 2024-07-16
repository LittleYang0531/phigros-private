<script setup lang="ts">
import zip from 'jszip';
import yaml from 'js-yaml';
import { packSkin } from './utils/skins';
import JSZip from 'jszip';
import { packEffect } from './utils/effects';

function handleDrop(e) {
  e.preventDefault();
  const files = e.dataTransfer.files;
  convertFile(files[0]);
}
function handleDragOver(e) {
  e.preventDefault();
}
function handleClick(e) {
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
    
    items.skins.push(await packSkin(newzip, zip));
    items.effects.push(await packEffect(newzip, zip));

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
</script>

<template>
  <div style="display: block; width: 100%">
    <h1 style="margin: 20px">
      Phira Respack -> Sonolus Collection Package
    </h1>
    <div id="dropzone" @drop="handleDrop" @dragover="handleDragOver" @click="handleClick" style="border: dashed 1px grey; height: 300px; border-radius: 5px; display: flex; display: -webkit-flex; justify-content: center; align-items: center; cursor: pointer; flex-direction: column; justify-content: center;">
      <h2 style="width: fit-content">Drag a file here or choose your file</h2>
      <p id="text"></p>
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
