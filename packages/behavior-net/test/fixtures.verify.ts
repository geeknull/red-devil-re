import { Asserter } from "../src/assert.ts";
import { getResourceAsStream, getCachedImage } from "@red-devil/j2me-shim";
import { installCanvasFactory } from "../src/fake-canvas.ts";
import { loadGameFixtures } from "../src/fixtures.ts";

const a = new Asserter();
installCanvasFactory();

await loadGameFixtures(1);
a.ok("game1 资源已注册 /res/image.bin", getResourceAsStream("/res/image.bin") !== null);
a.ok("game1 资源已注册 /res/t.bin", getResourceAsStream("/res/t.bin") !== null);
const img = getCachedImage<{ getWidth(): number; getHeight(): number }>("/res/image.bin", 0);
a.ok("game1 image.bin#0 stub 图有正尺寸", img.getWidth() > 0 && img.getHeight() > 0);

a.done("fixtures");
