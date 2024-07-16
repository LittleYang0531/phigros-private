import JSZip from "jszip";
import yaml from "js-yaml";
import { cropImage, emptySrl, getImageInfo, packArrayBuffer, packRaw, randomString, trimImage } from "./utils";
import { SkinData, SkinItem, SkinSpriteName } from "@sonolus/core"
import { tryCalculateLayout } from "./sprites";
import { gzip } from "pako";

const thumbnailUrl = "/src/assets/favicon.jpg";
var defaultSpritesList = [
    { name: SkinSpriteName.JudgmentLine, texture: "/src/assets/skins/JUDGMENT_LINE.png" },
    { name: SkinSpriteName.NoteConnectionBlue, texture: "/src/assets/skins/NOTE_CONNECTION_BLUE.png" },
    { name: SkinSpriteName.NoteConnectionYellow, texture: "/src/assets/skins/NOTE_CONNECTION_YELLOW.png" },
    { name: SkinSpriteName.NoteHeadBlue, texture: "/src/assets/skins/NOTE_HEAD_BLUE.png" },
    { name: SkinSpriteName.NoteHeadCyan, texture: "/src/assets/skins/NOTE_HEAD_CYAN.png" },
    { name: SkinSpriteName.NoteHeadRed, texture: "/src/assets/skins/NOTE_HEAD_RED.png" },
    { name: SkinSpriteName.NoteHeadYellow, texture: "/src/assets/skins/NOTE_HEAD_YELLOW.png" },
    { name: SkinSpriteName.NoteTailBlue, texture: "/src/assets/skins/NOTE_TAIL_BLUE.png" },
    { name: SkinSpriteName.NoteTailCyan, texture: "/src/assets/skins/NOTE_TAIL_CYAN.png" },
    { name: SkinSpriteName.NoteTailRed, texture: "/src/assets/skins/NOTE_TAIL_RED.png" },
    { name: SkinSpriteName.NoteTailYellow, texture: "/src/assets/skins/NOTE_TAIL_YELLOW.png" },
    { name: "0", texture: "/src/assets/skins/0.png" },
    { name: "1", texture: "/src/assets/skins/1.png" },
    { name: "2", texture: "/src/assets/skins/2.png" },
    { name: "3", texture: "/src/assets/skins/3.png" },
    { name: "4", texture: "/src/assets/skins/4.png" },
    { name: "5", texture: "/src/assets/skins/5.png" },
    { name: "6", texture: "/src/assets/skins/6.png" },
    { name: "7", texture: "/src/assets/skins/7.png" },
    { name: "8", texture: "/src/assets/skins/8.png" },
    { name: "9", texture: "/src/assets/skins/9.png" },
    { name: "Blocker", texture: "/src/assets/skins/Blocker.png" },
    { name: "combo", texture: "/src/assets/skins/combo.png" },
    { name: "Judgeline AllPerfect", texture: "/src/assets/skins/Judgeline AllPerfect.png" },
    { name: "Judgeline FullCombo", texture: "/src/assets/skins/Judgeline FullCombo.png" },
    { name: "Pause", texture: "/src/assets/skins/Pause.png" }
];

var customSpritesList = [
];

export async function packSkin(zip: JSZip, z: JSZip) {
    var info: Object = yaml.load(await z.file("info.yml").async("string"));

    var skin: SkinItem = {
        name: "phira-" + randomString(),
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
        const srl = await packRaw(thumbnailUrl);
        zip.file('sonolus/repository/' + srl.hash, srl.data, { binary: true });
        skin.thumbnail = { hash: srl.hash, url: '/sonolus/repository/' + srl.hash };
    }

    // 打包图像

    { // 处理 click.png;
        var img = "data:image/png;base64," + await z.file("click.png").async("base64");
        img = await trimImage(img);
        // document.getElementById("test-img").src = img;
        customSpritesList.push({ name: SkinSpriteName.NoteHeadCyan, texture: img });
    }

    { // 处理 click_mh.png
        var img = "data:image/png;base64," + await z.file("click_mh.png").async("base64");
        img = await trimImage(img);
        customSpritesList.push({ name: SkinSpriteName.NoteTailCyan, texture: img });
    }

    { // 处理 drag.png
        var img = "data:image/png;base64," + await z.file("drag.png").async("base64");
        img = await trimImage(img);
        customSpritesList.push({ name: SkinSpriteName.NoteHeadYellow, texture: img });
    }

    { // 处理 drag_mh.png
        var img = "data:image/png;base64," + await z.file("drag_mh.png").async("base64");
        img = await trimImage(img);
        customSpritesList.push({ name: SkinSpriteName.NoteTailYellow, texture: img });
    }

    { // 处理 flick.png
        var img = "data:image/png;base64," + await z.file("flick.png").async("base64");
        img = await trimImage(img);
        customSpritesList.push({ name: SkinSpriteName.NoteHeadRed, texture: img });
    }

    { // 处理 flick_mh.png
        var img = "data:image/png;base64," + await z.file("flick_mh.png").async("base64");
        img = await trimImage(img);
        customSpritesList.push({ name: SkinSpriteName.NoteTailRed, texture: img });
    }

    { // 处理 hold.png
        var img = "data:image/png;base64," + await z.file("hold.png").async("base64");
        var obj = await getImageInfo(img);
        var headHeight = info["holdAtlas"][1];
        var holdHead = await cropImage(img, 0, obj.height - headHeight, obj.width, headHeight);
        var holdBody = await cropImage(img, 0, 0, obj.width, obj.height - headHeight);
        customSpritesList.push({ name: SkinSpriteName.NoteHeadBlue, texture: holdHead });
        customSpritesList.push({ name: SkinSpriteName.NoteConnectionBlue, texture: holdBody });
    }

    { // 处理 hold_mh.png
        var img = "data:image/png;base64," + await z.file("hold_mh.png").async("base64");
        var obj = await getImageInfo(img);
        var headHeight = info["holdAtlasMH"][1];
        var holdHead = await cropImage(img, 0, obj.height - headHeight, obj.width, headHeight);
        var holdBody = await cropImage(img, 0, 0, obj.width, obj.height - headHeight);
        customSpritesList.push({ name: SkinSpriteName.NoteTailBlue, texture: holdHead });
        customSpritesList.push({ name: SkinSpriteName.NoteConnectionYellow, texture: holdBody });
    }

    if (info.hasOwnProperty("colorPerfect")) { // 自定义的 All Perfect 判定线
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
        customSpritesList.push({ name: "Judgeline AllPerfect", texture: img });
    }

    if (info.hasOwnProperty("colorGood")) { // 自定义的 Full Combo 判定线
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
    const { size, layouts } = await tryCalculateLayout(defaultSpritesList);

    // 绘制 SkinTexture
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
    const srl = await packRaw(texture);
    zip.file('sonolus/repository/' + srl.hash, srl.data, { binary: true });
    skin.texture = { hash: srl.hash, url: '/sonolus/repository/' + srl.hash };

    // 打包 SkinData
    skinData.width = size;
    skinData.height = size;
    skinData.sprites = layouts;
    const data = await packArrayBuffer(gzip(JSON.stringify(skinData), { level: 9 }));
    zip.file('sonolus/repository/' + data.hash, data.data, { binary: true });
    skin.data = { hash: data.hash, url: '/sonolus/repository/' + data.hash };

    console.log(skin);
    return skin;
}