import JSZip from "jszip";
import yaml from "js-yaml";
import { ParticleData, ParticleEffectName, ParticleItem } from "@sonolus/core";
import { cropImage, emptySrl, getImageInfo, hash, packArrayBuffer, packRaw, reportStatus } from "./utils";
import { tryCalculateLayout } from "./sprites";
import { gzip } from "pako";

var thumbnailUrl = "favicon.jpg";
var blockUrl = "block.png";

export async function packParticle(zip: JSZip, z: JSZip, loadList: Object) {
    var tmpurl = thumbnailUrl;
    thumbnailUrl = loadList[thumbnailUrl];

    var info: Object = yaml.load(await z.file("info.yml").async("string"));

    var particle: ParticleItem = {
        name: "phira-" + await hash(info["name"]),
        version: 3,
        title: info["name"],
        subtitle: info["author"],
        author: info["author"],
        thumbnail: emptySrl(),
        data: emptySrl(),
        texture: emptySrl(),
        tags: []
    };

    // 打包图标

    {
        reportStatus("Packing ParticleThumbnail...");
        const srl = await packRaw(thumbnailUrl);
        zip.file('sonolus/repository/' + srl.hash, srl.data, { binary: true });
        particle.thumbnail = { hash: srl.hash, url: '/sonolus/repository/' + srl.hash };
    }

    // 打包资源

    var spritesList = [{ name: "0", texture: loadList[blockUrl] }];
    {
        var img = "data:image/png;base64," + await z.file("hit_fx.png").async("base64");
        var imgInfo = await getImageInfo(img);
        var width = imgInfo.width, height = imgInfo.height;
        var w = info["hitFx"][0], h = info["hitFx"][1];
        reportStatus("Extracting hit_fx.png...");
        for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
            reportStatus("Extracting " + (j * w + i + 1) + ".png from hit_fx.png...", false);
            var x = i * width / w, y = j * height / h;
            var w_ = width / w, h_ = height / h;
            var imgs = await cropImage(img, x, y, w_, h_);
            if (width > 2000 || height > 2000) {
                reportStatus("Resizing " + (j * w + i + 1) + ".png...", false);
                var scale = 2000 / Math.max(width, height);
                var canvas = document.createElement("canvas");
                var ctx = canvas.getContext("2d");
                if (!ctx) throw "Failed to create canvas context";
                canvas.width = w_ * scale;
                canvas.height = w_ * scale;
                const imgInfo = await getImageInfo(imgs);
                ctx.drawImage(imgInfo.img, 0, 0, imgInfo.width, imgInfo.height, 0, 0, canvas.width, canvas.height);
                imgs = canvas.toDataURL();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            spritesList.push({ name: `${j * w + i + 1}`, texture: imgs });
        }
    }

    var particleData: ParticleData = {
        width: 0,
        height: 0,
        interpolation: false,
        sprites: [],
        effects: []
    }
    reportStatus("Calculating sprites layout...");
    const { size, layouts } = await tryCalculateLayout(spritesList);

    // 绘制 ParticleTexture
    reportStatus("Packing ParticleTexture...");
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    if (!ctx) throw "Failed to create canvas context";

    canvas.width = size;
    canvas.height = size;
    for (var i = 0; i < layouts.length; i++) {
        var src = spritesList.find((item) => item.name == layouts[i].name)?.texture;
        if (!src) throw "Failed to find texture: " + layouts[i].name;

        var image = await getImageInfo(src);
        ctx.drawImage(image.img, layouts[i].x, layouts[i].y);
    }
    var texture = canvas.toDataURL();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const srl = await packRaw(texture);
    zip.file('sonolus/repository/' + srl.hash, srl.data, { binary: true });
    particle.texture = { hash: srl.hash, url: '/sonolus/repository/' + srl.hash };

    // 打包 ParticleData
    reportStatus("Packing ParticleData...");
    var perfectColor = info.hasOwnProperty("colorPerfect") ? info["colorPerfect"].toString(16) : "feffa9";
    var goodColor = info.hasOwnProperty("colorGood") ? info["colorGood"].toString(16) : "a2eeff";
    if (perfectColor.length > 6) perfectColor = perfectColor.substr(length - 6);
    while (perfectColor.length < 6) perfectColor = "0" + perfectColor;
    if (goodColor.length > 6) goodColor = goodColor.substr(length - 6);
    while (goodColor.length < 6) goodColor = "0" + goodColor;
    perfectColor = "#" + perfectColor;
    goodColor = "#" + goodColor;
    particleData.width = size;
    particleData.height = size;
    particleData.sprites = layouts.sort((a, b) => parseInt(a.name) - parseInt(b.name));
    particleData.effects = [
        {
            name: ParticleEffectName.NoteLinearHoldYellow,
            transform: {
                x1: { x1: 1 }, x2: { x2: 1 }, x3: { x3: 1 }, x4: { x4: 1 },
                y1: { y1: 1 }, y2: { y2: 1 }, y3: { y3: 1 }, y4: { y4: 1 }
            },
            groups: [
                {
                    count: 1,
                    particles: particleData.sprites.slice(1).map((sprite, index) => {
                        var duration = 1 / (particleData.sprites.length - 1);
                        return {
                            sprite: index + 1,
                            color: perfectColor,
                            start: index * duration,
                            duration: duration,
                            x: { from: { c: 0 }, to: { c: 0 }, ease: "linear" },
                            y: { from: { c: 0 }, to: { c: 0 }, ease: "linear" },
                            w: { from: { c: 1 }, to: { c: 1 }, ease: "linear" },
                            h: { from: { c: 1 }, to: { c: 1 }, ease: "linear" },
                            r: { from: { c: 1 }, to: { c: 1 }, ease: "linear" },
                            a: { from: { c: 1 }, to: { c: 1 }, ease: "linear" },
                        };
                    })
                }, {
                    count: info.hasOwnProperty("hideParticles") && info["hideParticles"] == false ? 0 : 4,
                    particles: [
                        {
                            sprite: 0,
                            color: perfectColor,
                            start: 0,
                            duration: 1,
                            x: { from: { c: 0 }, to: { c: -2, r1: 4 }, ease: "outQuart" },
                            y: { from: { c: 0 }, to: { c: -2, r2: 4 }, ease: "outQuart" },
                            w: { from: { c: 0.1 }, to: { c: 0.1 }, ease: "linear" },
                            h: { from: { c: 0.1 }, to: { c: 0.1 }, ease: "linear" },
                            r: { from: { c: 0, r3: 10 }, to: { c: 0, r3: 10 }, ease: "linear" },
                            a: { from: { c: 1 }, to: { c: 0 }, ease: "inQuart" },
                        }
                    ]
                },
            ]
        }, {
            name: ParticleEffectName.NoteLinearHoldBlue,
            transform: {
                x1: { x1: 1 }, x2: { x2: 1 }, x3: { x3: 1 }, x4: { x4: 1 },
                y1: { y1: 1 }, y2: { y2: 1 }, y3: { y3: 1 }, y4: { y4: 1 }
            },
            groups: [
                {
                    count: 1,
                    particles: particleData.sprites.slice(1).map((sprite, index) => {
                        var duration = 1 / (particleData.sprites.length - 1);
                        return {
                            sprite: index + 1,
                            color: goodColor,
                            start: index * duration,
                            duration: duration,
                            x: { from: { c: 0 }, to: { c: 0 }, ease: "linear" },
                            y: { from: { c: 0 }, to: { c: 0 }, ease: "linear" },
                            w: { from: { c: 1 }, to: { c: 1 }, ease: "linear" },
                            h: { from: { c: 1 }, to: { c: 1 }, ease: "linear" },
                            r: { from: { c: 1 }, to: { c: 1 }, ease: "linear" },
                            a: { from: { c: 1 }, to: { c: 1 }, ease: "linear" },
                        };
                    })
                }, {
                    count: info.hasOwnProperty("hideParticles") && info["hideParticles"] == false ? 0 : 4,
                    particles: [
                        {
                            sprite: 0,
                            color: goodColor,
                            start: 0,
                            duration: 1,
                            x: { from: { c: 0 }, to: { c: -2, r1: 4 }, ease: "outQuart" },
                            y: { from: { c: 0 }, to: { c: -2, r2: 4 }, ease: "outQuart" },
                            w: { from: { c: 0.1 }, to: { c: 0.1 }, ease: "linear" },
                            h: { from: { c: 0.1 }, to: { c: 0.1 }, ease: "linear" },
                            r: { from: { c: 0, r3: 10 }, to: { c: 0, r3: 10 }, ease: "linear" },
                            a: { from: { c: 1 }, to: { c: 0 }, ease: "inQuart" },
                        }
                    ]
                },
            ]
        }
    ]
    const data = await packArrayBuffer(gzip(JSON.stringify(particleData), { level: 9 }));
    zip.file('sonolus/repository/' + data.hash, data.data, { binary: true });
    particle.data = { hash: data.hash, url: '/sonolus/repository/' + data.hash };

    thumbnailUrl = tmpurl;
    return particle;
}