// 生成 mock 阶段的演示资产:极简人形 GLB + 静态预览图 + 元数据。
//
// 用途:在真实建模管线就绪前,让结果页能加载并实时渲染一个真实 GLB 文件,
// 验证 GLTFLoader 加载路径与静态预览保底。
//
// 运行(在 apps/desktop-web 目录下,依赖已安装的 three):
//   node scripts/generate-demo-assets.mjs
//
// 输出到 services/reconstruction-api/assets/ 下的:
//   demo.glb  demo.meta.json  preview.png  thumbnail.png
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// GLTFExporter 二进制导出路径在 Node 中依赖 FileReader(Node 未内置),做最小 polyfill。
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        this.onloadend?.();
      });
    }
    readAsBinaryString(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = Buffer.from(buf).toString('binary');
        this.onloadend?.();
      });
    }
    readAsDataURL(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = 'data:application/octet-stream;base64,' + Buffer.from(buf).toString('base64');
        this.onloadend?.();
      });
    }
    readAsText(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = Buffer.from(buf).toString('utf8');
        this.onloadend?.();
      });
    }
  };
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../../../services/reconstruction-api/assets');
mkdirSync(OUT_DIR, { recursive: true });

// ---- 构建极简人形占位模型 -------------------------------------------

function buildHumanoid() {
  const group = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.7 });
  const top = new THREE.MeshStandardMaterial({ color: 0x4a6fa5, roughness: 0.6 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x2f3640, roughness: 0.6 });
  const shoes = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });

  const add = (geometry, material, x, y, z) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };

  add(new THREE.SphereGeometry(0.12, 24, 16), skin, 0, 1.5, 0); // 头
  add(new THREE.CylinderGeometry(0.04, 0.05, 0.1, 16), skin, 0, 1.36, 0); // 颈
  add(new THREE.CylinderGeometry(0.22, 0.26, 0.55, 24), top, 0, 1.0, 0); // 上身
  add(new THREE.CylinderGeometry(0.26, 0.18, 0.45, 24), pants, 0, 0.55, 0); // 胯/裤
  add(new THREE.CylinderGeometry(0.07, 0.08, 0.5, 16), pants, -0.09, 0.1, 0); // 左腿
  add(new THREE.CylinderGeometry(0.07, 0.08, 0.5, 16), pants, 0.09, 0.1, 0); // 右腿
  add(new THREE.BoxGeometry(0.14, 0.08, 0.24), shoes, -0.09, -0.16, 0.03); // 左鞋
  add(new THREE.BoxGeometry(0.14, 0.08, 0.24), shoes, 0.09, -0.16, 0.03); // 右鞋
  add(new THREE.CylinderGeometry(0.05, 0.06, 0.5, 16), top, -0.28, 1.05, 0); // 左臂
  add(new THREE.CylinderGeometry(0.05, 0.06, 0.5, 16), top, 0.28, 1.05, 0); // 右臂

  return group;
}

function countFaces(object) {
  let faces = 0;
  object.traverse((node) => {
    if (node.isMesh) {
      const geometry = node.geometry;
      faces += geometry.index
        ? geometry.index.count / 3
        : geometry.attributes.position.count / 3;
    }
  });
  return Math.round(faces);
}

// ---- 最小 PNG 编码器(无第三方依赖) ---------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 位深
  ihdr[9] = 6; // 颜色类型:RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: None
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- 生成带人形剪影的预览图 -----------------------------------------

function renderPreview(width, height) {
  const rgba = Buffer.alloc(width * height * 4);
  const setPx = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = (y * width + x) * 4;
    rgba[i] = r;
    rgba[i + 1] = g;
    rgba[i + 2] = b;
    rgba[i + 3] = a;
  };
  // 背景:暖色纵向渐变
  const top = [246, 243, 238];
  const bottom = [214, 206, 194];
  for (let y = 0; y < height; y++) {
    const t = y / height;
    const r = Math.round(top[0] + (bottom[0] - top[0]) * t);
    const g = Math.round(top[1] + (bottom[1] - top[1]) * t);
    const b = Math.round(top[2] + (bottom[2] - top[2]) * t);
    for (let x = 0; x < width; x++) setPx(x, y, r, g, b);
  }
  // 剪影颜色(与 GLB 上装 #4a6fa5 相近)
  const C = [74, 111, 165, 235];

  const fillRect = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) setPx(x, y, C[0], C[1], C[2], C[3]);
    }
  };
  const fillCircle = (cx, cy, radius) => {
    const r2 = radius * radius;
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) setPx(x, y, C[0], C[1], C[2], C[3]);
      }
    }
  };

  const s = width / 256; // 缩放
  const scale = (v) => Math.round(v * s);

  fillCircle(scale(128), scale(206), scale(20)); // 头
  fillRect(scale(88), scale(150), scale(168), scale(196)); // 上身
  fillRect(scale(52), scale(148), scale(74), scale(192)); // 左臂
  fillRect(scale(182), scale(148), scale(204), scale(192)); // 右臂
  fillRect(scale(96), scale(52), scale(114), scale(150)); // 左腿
  fillRect(scale(142), scale(52), scale(160), scale(150)); // 右腿
  fillRect(scale(88), scale(30), scale(120), scale(52)); // 左鞋
  fillRect(scale(136), scale(30), scale(168), scale(52)); // 右鞋

  return rgba;
}

// ---- 写出文件 --------------------------------------------------------

function exportGlb() {
  return new Promise((resolve, reject) => {
    const group = buildHumanoid();
    const faceCount = countFaces(group);
    const exporter = new GLTFExporter();
    exporter.parse(
      group,
      (result) => {
        const buffer = Buffer.from(result);
        writeFileSync(join(OUT_DIR, 'demo.glb'), buffer);
        resolve({ faceCount, size: buffer.length });
      },
      (error) => reject(error),
      { binary: true },
    );
  });
}

const { faceCount, size } = await exportGlb();

writeFileSync(
  join(OUT_DIR, 'demo.meta.json'),
  JSON.stringify({ faceCount, textureSize: 'solid-color' }, null, 2) + '\n',
);

writeFileSync(join(OUT_DIR, 'preview.png'), encodePng(512, 768, renderPreview(512, 768)));
writeFileSync(join(OUT_DIR, 'thumbnail.png'), encodePng(128, 192, renderPreview(128, 192)));

console.log(`written demo.glb (${(size / 1024).toFixed(1)} KB, ${faceCount} faces)`);
console.log('written demo.meta.json, preview.png, thumbnail.png');
