import JSZip from "jszip";
import yaml from "js-yaml";
import { EffectClipName, EffectData, EffectItem } from "@sonolus/core";
import { emptySrl, hash, packArrayBuffer, packRaw, reportStatus } from "./utils";
import { gzip } from "pako";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { report } from "node:process";

var thumbnailUrl = "favicon.jpg";
var defaultClipsList = [
    { name: EffectClipName.Perfect, clip: "PERFECT.mp3" },
    { name: EffectClipName.PerfectAlternative, clip: "PERFECT_ALTERNATIVE.mp3" },
    { name: EffectClipName.Hold, clip: "HOLD.mp3" },
    { name: "Phigros Tick", clip: "Phigros Tick.mp3" }
];

var customClipsList = [

];

export async function packEffect(zip: JSZip, z: JSZip, loadList: Object) {
    var tmp = JSON.parse(JSON.stringify(defaultClipsList)), tmpurl = thumbnailUrl;
    customClipsList = [];
    for (var i = 0; i < defaultClipsList.length; i++) defaultClipsList[i].clip = loadList[defaultClipsList[i].clip];
    thumbnailUrl = loadList[thumbnailUrl];

    var info: Object = yaml.load(await z.file("info.yml").async("string"));

    var effect: EffectItem = {
        name: "phira-" + await hash(info["name"]),
        version: 5,
        title: info["name"],
        subtitle: info["author"],
        author: info["author"],
        thumbnail: emptySrl(),
        data: emptySrl(),
        audio: emptySrl(),
        tags: []
    }

    // 打包图标

    {
        reportStatus("Packing EffectThumbnail...");
        const srl = await packRaw(thumbnailUrl);
        zip.file('sonolus/repository/' + srl.hash, srl.data, { binary: true });
        effect.thumbnail = { hash: srl.hash, url: '/sonolus/repository/' + srl.hash };
    }

    // 打包音效

    if (z.file("click.ogg") != null) { // 处理 click.ogg
        reportStatus("Processing click.ogg...", false);
        customClipsList.push({ name: EffectClipName.Perfect, clip: "data:audio/ogg;base64," + await z.file("click.ogg").async("base64") });
    }

    if (z.file("drag.ogg") != null) { // 处理 drag.ogg
        reportStatus("Processing drag.ogg...", false);
        customClipsList.push({ name: "Phigros Tick", clip: "data:audio/ogg;base64," + await z.file("drag.ogg").async("base64") });
    }

    if (z.file("flick.ogg") != null) { // 处理 flick.ogg
        reportStatus("Processing flick.ogg...", false);
        customClipsList.push({ name: EffectClipName.PerfectAlternative, clip: "data:audio/ogg;base64," + await z.file("flick.ogg").async("base64") });
    }

    for (var i = 0; i < customClipsList.length; i++) {
        for (var j = 0; j < defaultClipsList.length; j++) {
            if (defaultClipsList[j].name == customClipsList[i].name) {
                defaultClipsList[j] = customClipsList[i];
                break;
            }
        }
    }
    var effectData: EffectData = {
        clips: defaultClipsList.map(({ name, clip }, i) => ({ name, filename: i.toString(10) }))
    }
    var effectAudio: JSZip = new JSZip();
    var ffmpeg = new FFmpeg();
    await ffmpeg.load({
        coreURL: loadList["ffmpeg-core.js"],
        wasmURL: loadList["ffmpeg-core.wasm"]
    });
    reportStatus("Converting clips...");
    for (var i = 0; i < defaultClipsList.length; i++) {
        reportStatus("Converting \"" + defaultClipsList[i].name + "\"...", false);
        await ffmpeg.writeFile("input.ogg", await fetchFile(defaultClipsList[i].clip));
        await ffmpeg.exec([ '-i', 'input.ogg', 'output.mp3' ]);
        var output = await ffmpeg.readFile("output.mp3");
        // var output = await fetchFile(defaultClipsList[i].clip);
        effectAudio.file(i.toString(10), output, { binary: true });
    }

    // 打包 EffectData
    reportStatus("Packing EffectData...");
    const d = await packArrayBuffer(gzip(JSON.stringify(effectData), { level: 9 }));
    zip.file('sonolus/repository/' + d.hash, d.data, { binary: true });
    effect.data = { hash: d.hash, url: '/sonolus/repository/' + d.hash };

    // 打包 EffectAudio
    reportStatus("Packing EffectAudio...");
    const a = await packRaw(URL.createObjectURL(await effectAudio.generateAsync({ type: "blob" })));
    zip.file('sonolus/repository/' + a.hash, a.data, { binary: true });
    effect.audio = { hash: a.hash, url: '/sonolus/repository/' + a.hash };

    defaultClipsList = JSON.parse(JSON.stringify(tmp)); thumbnailUrl = tmpurl;
    return effect;
}