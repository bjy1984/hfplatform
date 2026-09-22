/**
 * render-svg.cjs —— 从 index.html 中的 FLOWS 数据重新生成独立 SVG 文件
 *
 * 产物：
 *   流程图/F1.svg … F6.svg          全景图（整张，看整体结构）
 *   流程图/分段/F1_第1段.svg …      分段精读图（每段带完整泳道表头，字号大、可读性高）
 *
 * 用途：在 index.html 里修改节点／连线／文字后，运行本脚本即可刷新全部 SVG，
 *       用于插入 Word、PPT、Visio、送印或存档。index.html 本身打开即是交互版泳道图。
 *
 * 用法（Node 22+）：
 *   cd /Users/mac/Documents/hfplatform/docs/流程图
 *   node tools/render-svg.cjs
 *
 * 说明：脚本只读取 index.html 中 <script> 内的渲染逻辑，不修改 index.html。
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dir = path.resolve(__dirname, '..');
const htmlPath = path.join(dir, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('未在 index.html 中找到 <script> 块'); process.exit(1); }

// —— 极简 DOM 替身：足以跑通 buildSvg，不需要浏览器 ——
function El(tag) {
  return {
    tagName: tag, children: [], attrs: {}, _t: '',
    appendChild(c) { this.children.push(c); return c; },
    insertBefore(c) { this.children.unshift(c); return c; },
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k]; },
    removeChild() {}, addEventListener() {}, closest() { return null; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    get firstChild() { return this.children[0] || null; },
    set innerHTML(v) {}, get innerHTML() { return ''; },
    set textContent(v) { this._t = v; }, get textContent() { return this._t; }
  };
}
const ctx = {
  document: {
    createElement: t => El(t), createElementNS: (ns, t) => El(t),
    getElementById: () => El('div'), querySelector: () => null,
    querySelectorAll: () => [], body: El('body')
  },
  window: { addEventListener() {}, scrollTo() {}, print() {} },
  location: { hash: '' }, requestAnimationFrame() {}, console,
  XMLSerializer: function () { this.serializeToString = () => ''; },
  Image: function () {}, Math, Array, Object, String, parseFloat, setTimeout
};
ctx.window.document = ctx.document;
vm.createContext(ctx);
vm.runInContext(m[1], ctx, { filename: 'index-inline.js' });

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function serialize(el) {
  const attrs = Object.entries(el.attrs || {})
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => ' ' + k + '="' + esc(v) + '"').join('');
  const kids = (el.children || []).map(serialize).join('');
  return '<' + el.tagName + attrs + '>' + kids + (el._t ? esc(el._t) : '') + '</' + el.tagName + '>';
}

const HEADER = 48;
/** 在图形上方加一条标题栏（左标题 / 右副标题），整图下移 HEADER 像素 */
function withHeader(built, title, sub) {
  const W = built.L.W, H = built.L.H;
  const root = El('svg');
  root.attrs = {
    xmlns: ctx.SVGNS, viewBox: '0 0 ' + W + ' ' + (H + HEADER),
    width: W, height: H + HEADER,
    'font-family': '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif'
  };
  const defs = built.svg.children.find(c => c.tagName === 'defs');
  if (defs) root.appendChild(defs);
  const bg = El('rect');
  bg.attrs = { x: 0, y: 0, width: W, height: H + HEADER, fill: '#ffffff' };
  root.appendChild(bg);
  const t1 = El('text');
  t1.attrs = { x: 18, y: 32, 'font-size': 19, 'font-weight': 700, fill: '#1F2328' };
  t1.textContent = title;
  root.appendChild(t1);
  const t2 = El('text');
  t2.attrs = { x: W - 18, y: 32, 'font-size': 13, fill: '#7A828C', 'text-anchor': 'end' };
  t2.textContent = sub;
  root.appendChild(t2);
  const ln = El('line');
  ln.attrs = { x1: 0, y1: HEADER - 6, x2: W, y2: HEADER - 6, stroke: '#DEDBD4', 'stroke-width': 2 };
  root.appendChild(ln);
  const g = El('g');
  g.attrs = { transform: 'translate(0,' + HEADER + ')' };
  built.svg.children.forEach(c => { if (c.tagName !== 'defs') g.appendChild(c); });
  root.appendChild(g);
  return root;
}
function write(name, node) {
  fs.writeFileSync(path.join(dir, name), '<?xml version="1.0" encoding="UTF-8"?>\n' + serialize(node), 'utf8');
}

const segDir = path.join(dir, '分段');
if (!fs.existsSync(segDir)) fs.mkdirSync(segDir, { recursive: true });

let nPan = 0, nSeg = 0;
for (const key of ['F1', 'F2', 'F3', 'F4', 'F5', 'F6']) {
  const flow = ctx.FLOWS[key];
  if (!flow) { console.warn(key + ' 数据缺失，跳过'); continue; }
  const segs = ctx.segmentsOf(flow);

  // 全景
  const full = ctx.buildSvg(flow, null, segs);
  write(key + '.svg', withHeader(full,
    key + '　' + flow.title,
    '全景（整张）· ' + flow.nodes.length + ' 节点 / ' + flow.edges.length + ' 连线 · 核对稿 2026-09-21'));
  console.log(key + '.svg\t全景 ' + full.L.W + '×' + full.L.H);
  nPan++;

  // 分段精读
  let sum = '';
  for (let i = 0; i < segs.length; i++) {
    const b = ctx.buildSvg(flow, segs[i], segs, { hideIdle: true });
    const ids = flow.nodes.filter(x => x.col >= segs[i].c1 && x.col <= segs[i].c2).map(x => x.id);
    const label = '第 ' + (i + 1) + ' / ' + segs.length + ' 段（' + ids[0] + ' — ' + ids[ids.length - 1] + '）';
    write('分段/' + key + '_第' + (i + 1) + '段.svg',
      withHeader(b, key + '　' + flow.title + '　第 ' + (i + 1) + ' 段',
        label + ' · 节点 ' + b.L.vis.length + ' · 本段未参与泳道已隐藏 · 核对稿 2026-09-21'));
    sum += label + '  ';
    nSeg++;
  }
  console.log('\t分段 ' + segs.length + ' 张：' + sum);
}
console.log('完成：全景 ' + nPan + ' 个，分段 ' + nSeg + ' 个。');
