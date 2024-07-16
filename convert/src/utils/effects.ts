import JSZip from "jszip";
import yaml from "js-yaml";
import { EffectClipName, EffectData, EffectItem } from "@sonolus/core";
import { emptySrl, packArrayBuffer, packRaw, randomString } from "./utils";
import { gzip } from "pako";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const thumbnailUrl = "/src/assets/favicon.jpg";
var defaultClipsList = [
    { name: EffectClipName.Perfect, clip: "/src/assets/effects/PERFECT.mp3" },
    { name: EffectClipName.PerfectAlternative, clip: "/src/assets/effects/PERFECT_ALTERNATIVE.mp3" },
    { name: EffectClipName.Hold, clip: "/src/assets/effects/HOLD.mp3" },
    { name: "Phigros Tick", clip: "/src/assets/effects/Phigros Tick.mp3" }
];

var customClipsList = [

];

export async function packEffect(zip: JSZip, z: JSZip) {
    var info: Object = yaml.load(await z.file("info.yml").async("string"));

    var effect: EffectItem = {
        name: "phira-" + randomString(),
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
        const srl = await packRaw(thumbnailUrl);
        zip.file('sonolus/repository/' + srl.hash, srl.data, { binary: true });
        effect.thumbnail = { hash: srl.hash, url: '/sonolus/repository/' + srl.hash };
    }

    // 打包音效

    if (z.file("click.ogg") != null) { // 处理 click.ogg
        customClipsList.push({ name: EffectClipName.Perfect, clip: "data:audio/ogg;base64," + await z.file("click.ogg").async("base64") });
    }

    if (z.file("drag.ogg") != null) { // 处理 drag.ogg
        customClipsList.push({ name: "Phigros Tick", clip: "data:audio/ogg;base64," + await z.file("drag.ogg").async("base64") });
    }

    if (z.file("flick.ogg") != null) { // 处理 flick.ogg
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
        coreURL: await toBlobURL(`/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`/ffmpeg-core.wasm`, 'application/wasm')
    });
    for (var i = 0; i < defaultClipsList.length; i++) {
        await ffmpeg.writeFile("input.ogg", await fetchFile(defaultClipsList[i].clip));
        await ffmpeg.exec([ '-i', 'input.ogg', 'output.mp3' ]);
        var output = await ffmpeg.readFile("output.mp3");
        effectAudio.file(i.toString(10), output, { binary: true });
    }

    // 打包 EffectData
    const d = await packArrayBuffer(gzip(JSON.stringify(effectData), { level: 9 }));
    zip.file('sonolus/repository/' + d.hash, d.data, { binary: true });
    effect.data = { hash: d.hash, url: '/sonolus/repository/' + d.hash };

    // 打包 EffectAudio
    const a = await packArrayBuffer(gzip(await effectAudio.generateAsync({ type: "arraybuffer" }), { level: 9 }));
    zip.file('sonolus/repository/' + a.hash, a.data, { binary: true });
    effect.audio = { hash: a.hash, url: '/sonolus/repository/' + a.hash };

    return effect;
}