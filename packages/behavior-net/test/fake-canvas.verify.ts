import { Asserter } from "../src/assert.ts";
import { Image } from "@red-devil/j2me-shim";
import { installCanvasFactory } from "../src/fake-canvas.ts";

const a = new Asserter();
installCanvasFactory();

// 经官方缝 setCanvasFactory 后，Image 工厂方法不再需要浏览器画布即可工作
const mut = Image.createMutable(4, 4);
a.eq("createMutable 尺寸", [mut.getWidth(), mut.getHeight()], [4, 4]);

// createRGBImage 走 createImageData/putImageData 路径（game1 RGB444 管线），不应抛
const argb = new Int32Array(4 * 4).fill(0xffff0000);
const rgb = Image.createRGBImage(argb, 4, 4, true);
a.ok("createRGBImage 不抛且尺寸对", rgb.getWidth() === 4 && rgb.getHeight() === 4);

// 工厂产出的 canvas 带 __cid，供 drawImage 识别来源
const src = mut.source() as Record<string, unknown>;
a.ok("工厂 canvas 带 __cid", typeof src.__cid === "number");

a.done("fake-canvas");
