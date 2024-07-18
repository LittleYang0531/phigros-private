import CryptoJS from 'crypto-js'

export async function hash(data: ArrayBuffer) {
    const buffer = await CryptoJS.lib.WordArray.create(data)
    return CryptoJS.SHA1(buffer).toString()
}

export async function packRaw(url: string) {
    if (!url) throw 'Missing file'
    const buffer = await (await fetch(url)).arrayBuffer()

    return {
        hash: await hash(buffer),
        data: new Uint8Array(buffer),
    }
}

export async function packArrayBuffer(buffer: ArrayBuffer) {
    return {
        hash: await hash(buffer),
        data: new Uint8Array(buffer),
    }
}

export function emptySrl() {
    return {
        type: '',
        hash: '',
        url: ''
    }
}

export function randomString(len = 32) {
  const chars = "abcdef0123456789";
  let str = "";
  for (let i = 0; i < len; i++) str += chars[Math.floor(Math.random() * chars.length)];
  return str;
}

export type ImageInfo = {
    img: HTMLImageElement
    width: number
    height: number
}
export function getImageInfo(src: string) {
    return new Promise<ImageInfo>((resolve, reject) => {
        if (!src) {
            throw "Failed to load image!"
            return
        }

        const img = new Image()
        img.onload = () =>
            resolve({
                img,
                width: img.naturalWidth,
                height: img.naturalHeight,
            })
        img.onerror = () => { throw "Failed to load image: " + src; }
        img.src = src
    })
}

export async function cropImage(src: string, x: number, y: number, w: number, h: number) {
    const { img, width, height } = await getImageInfo(src)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw 'Failed to create canvas context'

    var sx = x, sy = y, sw = w, sh = h
    canvas.width = sw
    canvas.height = sh
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)

    var res = canvas.toDataURL();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return res;
}

export async function trimImage(src: string, limit: number = 0) {
    const { img, width, height } = await getImageInfo(src)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw 'Failed to create canvas context'

    var sx = 0, sy = 0, sw = width, sh = height
    var data = ctx.createImageData(sw, sh)
    var left = sw - 1, right = 0, top = sh - 1, bottom = 0
    canvas.width = sw
    canvas.height = sh
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
    data = ctx.getImageData(0, 0, sw, sh)
    var buffer = data.data
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < buffer.length; i += 4) {
        var a = buffer[i + 3]
        if (a <= limit) continue

        var x = (i / 4) % sw
        var y = Math.floor((i / 4) / sw)
        left = Math.min(left, x)
        right = Math.max(right, x)
        top = Math.min(top, y)
        bottom = Math.max(bottom, y)
    }

    var cw = right - left + 1
    var ch = bottom - top + 1
    if (cw <= 0 || ch <= 0) throw 'Failed to trim image'

    canvas.width = cw
    canvas.height = ch
    ctx.drawImage(img, sx + left, sy + top, cw, ch, 0, 0, cw, ch)

    var res = canvas.toDataURL();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return res;
}

export async function solveImage(src: string) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var newimg = await trimImage(src, 30);
    const newimgInfo = await getImageInfo(newimg);
    const imgInfo = await getImageInfo(src);
    canvas.width = newimgInfo.width * 2;
    canvas.height = canvas.width;
    ctx.drawImage(imgInfo.img, 0, 0, imgInfo.width, imgInfo.height, (canvas.width - imgInfo.width) / 2, (canvas.height - imgInfo.height) / 2, imgInfo.width, imgInfo.height);
    if (canvas.width > 1000) {
      var currentImg = canvas.toDataURL();
      var scale = 1000 / canvas.width;
      canvas.width *= scale;
      canvas.height *= scale;
      const imgInfo = await getImageInfo(currentImg);
      ctx.drawImage(imgInfo.img, 0, 0, imgInfo.width, imgInfo.height, 0, 0, canvas.width, canvas.height);
      var res = canvas.toDataURL();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return res;
    }
    var res = canvas.toDataURL();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return res;
}

export var count = 0;
const total = 26;
export async function clearStatus() {
    count = 0;
    document.getElementById("info-text").innerText = "Preparing...";
}
export async function reportStatus(text: string, addCount: boolean = true) {
    if (addCount) count++;
    document.getElementById("info-text").innerText = text;
    document.getElementById("progress").style.width = Math.min(100, count / total * 100) + "%";
}

// export async function resizeImage(src: string, ratio: number) {
//     var src0 = await trimImage(src, 254);
//     var src0info = await getImageInfo(src0);

//     document.getElementById("test-img").src = src;
//     const { img, width, height } = await getImageInfo(src)
//     const canvas = document.createElement('canvas')
//     const ctx = canvas.getContext('2d')
//     if (!ctx) throw 'Failed to create canvas context'

//     var currentRatio = width / height
//     var w = width, h = height
//     if (currentRatio < ratio) w = height * ratio
//     else h = width / ratio

//     canvas.width = w
//     canvas.height = h
//     if (currentRatio < ratio) ctx.drawImage(img, 0, 0, width, height, (w - width) / 2, 0, width, height)
//     else ctx.drawImage(img, 0, 0, width, height, 0, (h - height) / 2, width, height)

//     return canvas.toDataURL()
// }

// export function getDataURL(content: string, type: string) {
//     var blob: Blob = new Blob([content], { type: type });
//     return URL.createObjectURL(blob);
// }