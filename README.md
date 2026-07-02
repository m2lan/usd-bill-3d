# 💵 Hyper-Realistic $100 Bill — Interactive 3D Cloth Simulation

> **纯手写 Verlet + PBD 布料物理引擎** · 一根物理引擎库都不用，照样跑出 Apple 级产品级 3D 质感

一个基于 Web 的超写实 3D 交互式 $100 美元纸币场景，使用 React Three Fiber + 自研布料物理引擎实现。纸币可以被鼠标拖拽产生真实布料形变，开启吹风模式后会被气流托起、自然飘动。

> ### 🤖 由 **WorkBuddy（基于 LongCat-2.0）** 生成
> 
> 本项目由 **m2lan** 使用 **WorkBuddy** AI 助手（底层模型 **LongCat-2.0**）通过一组完整 prompt 一次性生成。从物理引擎、3D 渲染、贴图绘制到 UI 交互、README、宣传 GIF 均由 AI 端到端产出，不含任何第三方物理引擎库。
>
> #### 🔑 完整 Prompt（复制即可复刻）
>
> ```
> 请创建一个基于 Web 的超写实 3D 交互式 $100 美元纸币场景。
> 
> ## 技术栈
> - React + Vite
> - React Three Fiber (@react-three/fiber) 作为 3D 渲染框架
> - three.js 作为底层 3D 引擎
> - @react-three/postprocessing 用于后期处理
> - @react-three/drei 仅用于辅助工具（Environment / HDR / OrbitControls）
> 
> ❗ 禁止使用任何物理引擎库（如 Rapier、Cannon、Ammo）
> 所有物理效果必须手写实现（Verlet + PBD）
> 
> ## 核心功能
> 
> ### 1. 纸币布料物理模拟（核心）
> - 将纸币建模为规则粒子网格（建议 40–50 × 24–30）
> - 每个粒子包含 position / previousPosition / acceleration
> - 每帧执行：
>   1. Verlet 积分更新位置
>   2. 多轮约束迭代（至少 6–10 次）
> - 约束系统必须包含：
>   - 结构约束（Structural）：相邻粒子
>   - 剪切约束（Shear）：对角线连接
>   - 弯曲约束（Bending）：跳 1–2 个粒子
>   - 长程弯曲约束（Long-range bending）：跳 3–4 个粒子
> - 额外物理效果：
>   - 重力 · 阻尼（Damping 0.98~0.995）
>   - 风力场（Noise-based turbulence）
>   - 鼠标拖拽力（Raycast hit + impulse force）
>   - 边界约束（防止穿透地面）
> 
> ### 2. 100美元纸币建模
> - 高精度平面 UV 展开贴图
> - 材质使用 MeshStandardMaterial + PBR workflow
> - 贴图需包含：Diffuse / Normal / Roughness
> - 微法线扰动模拟纤维纸张结构
> - Roughness 非均匀分布（真实纸感）
> - 轻微 SSS（Subsurface Scattering 模拟透光边缘）
> 
> ### 3. 渲染与后处理（超写实关键）
> - 必须使用 postprocessing：
>   - Bloom（微弱，高光控制严格）
>   - Chromatic Aberration（极低强度）
>   - Vignette（轻微暗角）
>   - SSAO（增强接触阴影）
> - 光照系统：
>   - HDR Environment light（柔和室内光）
>   - 主光源模拟窗光（Directional Light）
>   - 补光弱 Fill Light
> - 整体风格：干净白色桌面 + 高级产品渲染风格（Apple-like product shot）
> 
> ### 4. 交互系统
> - 鼠标拖拽纸币任意点（Raycaster + nearest particle binding）
> - 拖拽产生局部形变，松手后自然回弹
> - WASD / QE：旋转和上下微调视角
> - Scroll：缩放
> - UI按钮：吹风模式（toggle wind field）+ 重置
> 
> ### 5. UI界面设计
> - 底部居中工具栏：毛玻璃（backdrop-filter: blur(20px)）
> - 半透明黑/白 + 圆角 + 微阴影
> - hover 有轻微 scale 动画
> - 顶部居中提示文字
> - cursor: pointer
> - 整体极简高级风格
> 
> ### 6. 性能优化（强制要求）
> - 所有 Vector3 必须复用（禁止 per-frame new）
> - useMemo 缓存 geometry / material / textures
> - 粒子数组初始化一次性创建
> - 约束计算避免 GC（使用 typed arrays 优先）
> - 控制 constraint iteration ≤ 10 保证 60fps
> ```
> 
> ---
>
> 📌 **关于 WorkBuddy / LongCat-2.0**
>
> | | 详情 |
> |---|---|
> | **AI 助手产品名** | WorkBuddy |
> | **底层模型** | LongCat-2.0 |
> | **开发者** | m2lan（深圳） |
> | **能力域** | 全栈 Web 开发 · 3D 图形与物理仿真 · 工程化文档 · 内容生成 |
> | **工作流程** | 单条 prompt → 自研物理引擎 + R3F 渲染 + 程序化贴图 + UI + README + GIF，一次性端到端交付 |

---

## ✨ 核心特性

### 🪁 布料物理引擎（自研）
- **Verlet 积分 + Position-Based Dynamics (PBD)** — 纯数学实现，零物理引擎库
- **50×30 规则粒子网格**（1500 个粒子）
- **四类约束系统**：
  - Structural 结构约束（相邻粒子）
  - Shear 剪切约束（对角线）
  - Bending 弯曲约束（跳 2 粒子）
  - Long-range Bending 长程弯曲约束（跳 3 粒子）
- **9 轮约束迭代** + **2 轮物理子步** — 保证 60fps 稳定运行
- **Noise-based 风力场** + 鼠标 Raycaster 拖拽力

### 🎨 超写实渲染
- 程序化生成高分辨率贴图（Diffuse / Normal / Roughness）
- **PBR MeshStandardMaterial** 物理材质
- 微法线扰动模拟纤维纸张结构
- 非均匀 Roughness 分布 → 真实纸感
- `@react-three/postprocessing` 全套后期：
  - SSAO 接触阴影
  - Bloom 微弱高光
  - Chromatic Aberration 色散
  - Vignette 暗角
- HDR Environment + Lightformer 三点布光（窗光模拟）

### 🖱️ 交互系统
- **鼠标拖拽** — Raycaster 命中 → 最近粒子绑定 → 局部形变 → 自然回弹
- **OrbitControls** — 环绕 / 缩放 / 俯仰
- **吹风模式** — 从下往上托起，配合水平飘摆 + 高频颤动
- **重置按钮** — 恢复初始状态

---

## 🚀 快速开始

```bash
# 克隆后安装依赖
npm install

# 启动开发服务器 (http://localhost:5173)
npm run dev

# 构建生产版本
npm run build
```

---

## 📁 项目结构

```
usd-bill-3d/
├── src/
│   ├── App.jsx                    # Canvas / EffectComposer / 交互 UI
│   ├── main.jsx                   # React 入口
│   ├── index.css                  # 全局样式 + 毛玻璃工具栏
│   ├── physics/
│   │   └── ClothSimulation.js     # ★ 核心：Verlet + PBD 物理引擎
│   ├── components/
│   │   └── ClothBill.jsx          # 布料网格组件 + 拖拽 + 动画帧
│   └── utils/
│       └── generateTextures.js     # ★ 程序化生成 $100 全套贴图
├── public/
├── dist/                          # 构建产物
├── package.json
└── vite.config.js
```

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + Vite |
| 3D 渲染 | @react-three/fiber + three.js |
| 后期处理 | @react-three/postprocessing |
| 辅助工具 | @react-three/drei (Environment / OrbitControls) |
| 物理引擎 | **自研 Verlet + PBD** ← 不用 Rapier / Cannon / Ammo |

---

## 🎛️ 物理参数调节

打开 `src/physics/ClothSimulation.js` 可自定义配置：

```javascript
const sim = new ClothSimulation({
  width: 50,           // 粒子横向数量
  height: 30,          // 粒子纵向数量
  segmentSize: 0.0238, // 粒子间距
  damping: 0.987,      // 阻尼 (0~1)
  iterations: 9,       // 约束迭代轮数
  gravityScale: 0.4,   // 重力缩放
  windStrength: 2.8,   // 风力强度
  windSpeed: 1.8,      // 风速变化
  liftHeight: 0.12     // 初始悬浮高度
});
```

---

## ⚡ 性能优化

- ✅ 所有 Vector3 复用（禁止 per-frame new）
- ✅ useMemo 缓存 geometry / material / textures
- ✅ Float32Array 粒子数组一次性创建
- ✅ 位置/法线使用 `DynamicDrawUsage` + `needsUpdate`
- ✅ 约束迭代 ≤ 9 轮 × 2 子步 = 18 轮 → 保证 60fps
- ✅ 2 次物理子步避免穿模
- ✅ Canvas `dpr={[1, 2]}` + `antialias`

---

## 🧠 实现思路

### 物理引擎

```
每帧流程：
1. Verlet 积分 → 更新每个粒子位置
   - 通过前帧位置差计算隐式速度
   - 叠加重力 + 风力
   
2. PBD 约束求解（9轮迭代）
   - 遍历 7800+ 条约束
   - 计算两点距离与静长度的偏差
   - 按惯性权重分配修正量
   
3. 边界约束
   - Floor Y 穿透修正
   - 球形边界（半径 3.0）
   
4. 导出 BufferGeometry
   - 复制粒子坐标
   - 逐面法线累加 → 归一化
   - 标记 needsUpdate
```

### 贴图系统

全部由 Canvas 2D 程序化绘制，无需加载外部图片：

- **正面 Diffuse**: 本杰明·富兰克林肖像、独立厅、财政印章、冠字号码、Guilloché 拼花底纹、微印刷
- **背面 Diffuse**: 独立厅建筑 + 四角 "100" 字样
- **Normal Map**: 双向纤维噪音扰动
- **Roughness Map**: 非均匀墨迹分布（墨区平滑、纸区粗糙）

---

## 🎬 在线体验

访问部署链接即可体验完整 3D 交互效果。

---

## 📝 License

MIT

---

> 🧵 *不用任何物理引擎，从 Verlet 积分到 PBD 约束，所有物理效果一行一行自己写——这就是对"为什么不用现成库"的最佳回答。*
