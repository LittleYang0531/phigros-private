import JSZip from "jszip";
import yaml, { load } from "js-yaml";
import { cropImage, emptySrl, getImageInfo, hash, packArrayBuffer, packRaw, reportStatus, solveImage } from "./utils";
import { SkinData, SkinItem, SkinSpriteName } from "@sonolus/core"
import { tryCalculateLayout } from "./sprites";
import { gzip } from "pako";
import { report } from "node:process";

var thumbnailUrl = "favicon.jpg";
var defaultSpritesList = [
    { name: SkinSpriteName.JudgmentLine, texture: "JUDGMENT_LINE.png" },
    { name: SkinSpriteName.NoteConnectionBlue, texture: "NOTE_CONNECTION_BLUE.png" },
    { name: SkinSpriteName.NoteConnectionYellow, texture: "NOTE_CONNECTION_YELLOW.png" },
    { name: SkinSpriteName.NoteHeadBlue, texture: "NOTE_HEAD_BLUE.png" },
    { name: SkinSpriteName.NoteHeadCyan, texture: "NOTE_HEAD_CYAN.png" },
    { name: SkinSpriteName.NoteHeadRed, texture: "NOTE_HEAD_RED.png" },
    { name: SkinSpriteName.NoteHeadYellow, texture: "NOTE_HEAD_YELLOW.png" },
    { name: SkinSpriteName.NoteTailBlue, texture: "NOTE_TAIL_BLUE.png" },
    { name: SkinSpriteName.NoteTailCyan, texture: "NOTE_TAIL_CYAN.png" },
    { name: SkinSpriteName.NoteTailRed, texture: "NOTE_TAIL_RED.png" },
    { name: SkinSpriteName.NoteTailYellow, texture: "NOTE_TAIL_YELLOW.png" },
    { name: "0", texture: "0.png" },
    { name: "1", texture: "1.png" },
    { name: "2", texture: "2.png" },
    { name: "3", texture: "3.png" },
    { name: "4", texture: "4.png" },
    { name: "5", texture: "5.png" },
    { name: "6", texture: "6.png" },
    { name: "7", texture: "7.png" },
    { name: "8", texture: "8.png" },
    { name: "9", texture: "9.png" },
    { name: "Blocker", texture: "Blocker.png" },
    { name: "combo", texture: "combo.png" },
    { name: "Judgeline AllPerfect", texture: "Judgeline AllPerfect.png" },
    { name: "Judgeline FullCombo", texture: "Judgeline FullCombo.png" },
    { name: "Pause", texture: "Pause.png" }
];

var customSpritesList = [
    
];

export async function packSkin(zip: JSZip, z: JSZip, loadList: Object) {
    var tmp = JSON.parse(JSON.stringify(defaultSpritesList)), tmpurl = thumbnailUrl;
    customSpritesList = [];
    for (var i = 0; i < defaultSpritesList.length; i++) defaultSpritesList[i].texture = loadList[defaultSpritesList[i].texture];
    thumbnailUrl = loadList[thumbnailUrl];

    var info: Object = yaml.load(await z.file("info.yml").async("string"));

    var skin: SkinItem = {
        name: "phira-" + await hash(info["name"]),
        version: 4,
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
        reportStatus("Packing SkinThumbnail...");
        const srl = await packRaw(thumbnailUrl);
        zip.file('sonolus/repository/' + srl.hash, srl.data, { binary: true });
        skin.thumbnail = { hash: srl.hash, url: '/sonolus/repository/' + srl.hash };
    }

    // 打包图像

    { // 处理 click.png;
        reportStatus("Processing click.png...");
        var img = "data:image/png;base64," + await z.file("click.png").async("base64");
        img = await solveImage(img);
        customSpritesList.push({ name: SkinSpriteName.NoteHeadCyan, texture: img });
    }

    { // 处理 click_mh.png
        reportStatus("Processing click_mh.png...");
        var img = "data:image/png;base64," + await z.file("click_mh.png").async("base64");
        img = await solveImage(img);
        customSpritesList.push({ name: SkinSpriteName.NoteTailCyan, texture: img });
    }

    { // 处理 drag.png
        reportStatus("Processing drag.png...");
        var img = "data:image/png;base64," + await z.file("drag.png").async("base64");
        img = await solveImage(img);
        customSpritesList.push({ name: SkinSpriteName.NoteHeadYellow, texture: img });
    }

    { // 处理 drag_mh.png
        reportStatus("Processing drag_mh.png...");
        var img = "data:image/png;base64," + await z.file("drag_mh.png").async("base64");
        img = await solveImage(img);
        customSpritesList.push({ name: SkinSpriteName.NoteTailYellow, texture: img });
    }

    { // 处理 flick.png
        reportStatus("Processing flick.png...");
        var img = "data:image/png;base64," + await z.file("flick.png").async("base64");
        img = await solveImage(img);
        customSpritesList.push({ name: SkinSpriteName.NoteHeadRed, texture: img });
    }

    { // 处理 flick_mh.png
        reportStatus("Processing flick_mh.png...");
        var img = "data:image/png;base64," + await z.file("flick_mh.png").async("base64");
        img = await solveImage(img);
        customSpritesList.push({ name: SkinSpriteName.NoteTailRed, texture: img });
    }

    { // 处理 hold.png
        reportStatus("Processing hold.png...");
        var img = "data:image/png;base64," + await z.file("hold.png").async("base64");
        var obj = await getImageInfo(img);
        var headHeight = info["holdAtlas"][1];
        var holdHead = await cropImage(img, 0, obj.height - headHeight, obj.width, headHeight);
        var holdBody = await cropImage(img, 0, 0, obj.width, obj.height - headHeight);
        customSpritesList.push({ name: SkinSpriteName.NoteHeadBlue, texture: holdHead });
        customSpritesList.push({ name: SkinSpriteName.NoteConnectionBlue, texture: holdBody });
    }

    { // 处理 hold_mh.png
        reportStatus("Processing hold_mh.png...");
        var img = "data:image/png;base64," + await z.file("hold_mh.png").async("base64");
        var obj = await getImageInfo(img);
        var headHeight = info["holdAtlasMH"][1];
        var holdHead = await cropImage(img, 0, obj.height - headHeight, obj.width, headHeight);
        var holdBody = await cropImage(img, 0, 0, obj.width, obj.height - headHeight);
        customSpritesList.push({ name: SkinSpriteName.NoteTailBlue, texture: holdHead });
        customSpritesList.push({ name: SkinSpriteName.NoteConnectionYellow, texture: holdBody });
    }

    if (info.hasOwnProperty("colorPerfect")) { // 自定义的 All Perfect 判定线
        reportStatus("Processing All Perfect judgeline.png...", false);
        var color = info["colorPerfect"];
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        if (!ctx) throw "Failed to create canvas context";

        canvas.width = 100;
        canvas.height = 100;
        color = color.toString(16);
        if (color.length > 6) color = color.substr(length - 6);
        while (color.length < 6) color = "0" + color;
        ctx.fillStyle = "#" + color;
        ctx.fillRect(0, 0, 100, 100);
        var img = canvas.toDataURL();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        customSpritesList.push({ name: "Judgeline AllPerfect", texture: img });
    }

    if (info.hasOwnProperty("colorGood")) { // 自定义的 Full Combo 判定线
        reportStatus("Processing Full Combo judgeline.png...", false);
        var color = info["colorGood"];
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        if (!ctx) throw "Failed to create canvas context";

        canvas.width = 100;
        canvas.height = 100;
        color = color.toString(16);
        if (color.length > 6) color = color.substr(length - 6);
        while (color.length < 6) color = "0" + color;
        ctx.fillStyle = "#" + color;
        ctx.fillRect(0, 0, 100, 100);
        var img = canvas.toDataURL();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        customSpritesList.push({ name: "Judgeline FullCombo", texture: img });
    }

    var skinData: SkinData = {
        width: 0,
        height: 0,
        interpolation: false,
        sprites: []
    };
    for (var i = 0; i < customSpritesList.length; i++) {
        for (var j = 0; j < defaultSpritesList.length; j++) {
            if (defaultSpritesList[j].name == customSpritesList[i].name) {
                defaultSpritesList[j] = customSpritesList[i];
                break;
            }
        }
    }
    reportStatus("Calculating sprites layout...");
    const { size, layouts } = await tryCalculateLayout(defaultSpritesList);

    // 绘制 SkinTexture
    reportStatus("Packing SkinTexture...");
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    if (!ctx) throw "Failed to create canvas context";

    canvas.width = size;
    canvas.height = size;
    for (var i = 0; i < layouts.length; i++) {
        var src = defaultSpritesList.find((item) => item.name == layouts[i].name)?.texture;
        if (!src) throw "Failed to find texture: " + layouts[i].name;

        var image = await getImageInfo(src);
        ctx.drawImage(image.img, layouts[i].x, layouts[i].y);
    }
    var texture = canvas.toDataURL();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const srl = await packRaw(texture);
    zip.file('sonolus/repository/' + srl.hash, srl.data, { binary: true });
    skin.texture = { hash: srl.hash, url: '/sonolus/repository/' + srl.hash };

    // 打包 SkinData
    reportStatus("Packing SkinData...");
    skinData.width = size;
    skinData.height = size;
    skinData.sprites = layouts;
    const data = await packArrayBuffer(gzip(JSON.stringify(skinData), { level: 9 }));
    zip.file('sonolus/repository/' + data.hash, data.data, { binary: true });
    skin.data = { hash: data.hash, url: '/sonolus/repository/' + data.hash };

    defaultSpritesList = JSON.parse(JSON.stringify(tmp)); thumbnailUrl = tmpurl;
    return skin;
}