import { getImageInfo } from "./utils"

export type SpriteLayout = {
    name: string
    texture: string
}

export async function tryCalculateLayout(sprite: SpriteLayout[]) {
    let size = 128
    while (size <= 65536) {
        try {
            return {
                size,
                layouts: await calculateLayout(sprite, size),
            }
        } catch (e) {
            size *= 2
        }
    }
    throw 'Maximum texture size (4096x4096) exceeded'
}

async function calculateLayout(sprite: SpriteLayout[], size: number) {
    const sprites: {
        name: string
        w: number
        h: number
    }[] = []

    for (const { name, texture } of sprite) {
        const { width, height } = await getImageInfo(texture)

        sprites.push({
            name,
            w: width,
            h: height,
        })
    }


    const spaces = [{ x: 0, y: 0, width: size, height: size }]

    return sprites
        .sort(
            (a, b) =>
                b.w * b.h - a.w * a.h ||
                b.w + b.h - (a.w + a.h),
        )
        .map(({ name, w, h }) => {
            const spaceIndex = spaces.findIndex(
                (space) => space.width >= w && space.height >= h,
            )
            if (spaceIndex == -1) throw 'Insufficient size'

            const space = spaces[spaceIndex]
            spaces.splice(spaceIndex, 1)

            if (space.height > h) {
                spaces.unshift({
                    x: space.x,
                    y: space.y + h,
                    width: space.width,
                    height: space.height - h,
                })
            }

            if (space.width > w) {
                spaces.unshift({
                    x: space.x + w,
                    y: space.y,
                    width: space.width - w,
                    height: h,
                })
            }

            return {
                name: name,
                x: space.x,
                y: space.y,
                w: w,
                h: h,
                transform: {
                    x1: { x1: 1 }, x2: { x2: 1 }, x3: { x3: 1 }, x4: { x4: 1 },
                    y1: { y1: 1 }, y2: { y2: 1 }, y3: { y3: 1 }, y4: { y4: 1 },
                }
            }
        })
}