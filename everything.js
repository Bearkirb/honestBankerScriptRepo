for (let i = window.requestAnimationFrame(function () { }); i > 0; i--)
    window.cancelAnimationFrame(i);
var c = document.getElementById("m"),
    ctx = c.getContext("2d");
ctx.imageSmoothingEnabled = false;
const BASE_W = 640;
const BASE_H = 360;

function resizeCanvas() {
    const maxScale = Math.min(
        window.innerWidth / BASE_W,
        window.innerHeight / BASE_H
    );

    // Snap to half-integer scales
    const scale = Math.max(0.5, Math.floor(maxScale * 4) / 4);

    c.style.width = `${BASE_W * scale}px`;
    c.style.height = `${BASE_H * scale}px`;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
class Input {
    constructor(canvas) {
        this.canvas = canvas;

        this.mouseX = 0;
        this.mouseY = 0;
        this.pmouseX = 0;
        this.pmouseY = 0;

        this.mouseXW = 0;
        this.mouseYW = 0;

        this.mouseDown = false;
        this.mousePressed = false;
        this.mouseDuration = 0;

        this.keys = {};
        this.scroll = 0;

        this.ls = { x: 0, y: 0 };
        this.rs = { x: 0, y: 0 };

        this.targetLS = { x: 0, y: 0 };
        this.targetRS = { x: 0, y: 0 };

        this.buttons = {};
        this.lb = [0, 0];
        this.rb = [0, 0];

        this.d = [0, 0, 0, 0];
        this.g = [0, 0, 0, 0];

        this.gamepad = null;

        canvas.addEventListener("mousedown", () => {
            this.mouseDown = true;
            this.mousePressed = true;
        });

        window.addEventListener("mouseup", () => {
            this.mouseDown = false;
        });

        window.addEventListener("mousemove", event => {
            const rect = canvas.getBoundingClientRect();

            this.pmouseX = this.mouseX;
            this.pmouseY = this.mouseY;

            // Convert browser coordinates into 640x360 canvas coordinates.
            this.mouseX =
                (event.clientX - rect.left) * canvas.width / rect.width;

            this.mouseY =
                (event.clientY - rect.top) * canvas.height / rect.height;
        });

        window.addEventListener("keydown", event => {
            event.preventDefault();
            this.keys[event.key] = true;
        });

        window.addEventListener("keyup", event => {
            delete this.keys[event.key];
        });

        canvas.addEventListener("wheel", event => {
            event.preventDefault();
            this.scroll -= event.deltaY;
        }, { passive: false });
    }

    get mouseDX() {
        return this.mouseX - this.pmouseX;
    }

    get mouseDY() {
        return this.mouseY - this.pmouseY;
    }

    isKeyDown(key) {
        return !!this.keys[key];
    }
    updatePre() {
        const gamepads = navigator.getGamepads();

        this.gamepad = null;

        for (let i = gamepads.length - 1; i >= 0; i--) {
            if (gamepads[i]?.connected) {
                this.gamepad = gamepads[i];
                break;
            }
        }

        if (this.gamepad) {
            this.updateGamepad(this.gamepad);
        } else {
            this.updateKeyboard();
            this.smoothSticks();

        }
    }
    updatePost() {
        if (this.mouseDown) {
            this.mouseDuration++;
        } else {
            this.mouseDuration = 0;
        }

        // Just been pressed
        this.mousePressed = false;


        this.pmouseX = this.mouseX;
        this.pmouseY = this.mouseY;



    }
    updateGamepad(gamepad) {
        this.buttons = {};

        for (let i = 0; i < gamepad.buttons.length; i++) {
            if (gamepad.buttons[i].pressed) {
                this.buttons[i] = true;
            }
        }

        this.lb[0] = this.buttons[4] || this.buttons[6] ? 1 : 0;
        this.rb[0] = this.buttons[5] || this.buttons[7] ? 1 : 0;

        this.ls.x = this.axis(gamepad.axes[0]);
        this.ls.y = -this.axis(gamepad.axes[1]);

        this.rs.x = this.axis(gamepad.axes[2]);
        this.rs.y = -this.axis(gamepad.axes[3]);
    }

    updateKeyboard() {

        this.targetLS.x = this.isKeyDown("d") - this.isKeyDown("a");
        this.targetLS.y = this.isKeyDown("w") - this.isKeyDown("s");

        this.targetRS.x = this.isKeyDown("ArrowRight") - this.isKeyDown("ArrowLeft");
        this.targetRS.y = this.isKeyDown("ArrowUp") - this.isKeyDown("ArrowDown");
    }
    smoothSticks() {
        this.ls.x = this.smooth(this.ls.x, this.targetLS.x);
        this.ls.y = this.smooth(this.ls.y, this.targetLS.y);

        this.rs.x = this.smooth(this.rs.x, this.targetRS.x);
        this.rs.y = this.smooth(this.rs.y, this.targetRS.y);

        this.normalizeStick(this.ls);
        this.normalizeStick(this.rs);
    }
    smooth(value, target) {
        return Math.lerp(
            value,
            target,
            0.7 / (Math.abs(value - target) + 0.7)
        );
    }

    normalizeStick(stick) {
        const length = Math.hypot(stick.x, stick.y);

        if (length > 1) {
            stick.x /= length;
            stick.y /= length;
        }
    }

    axis(value) {
        return Math.sign(value) * Math.sqrt(Math.round(value * value * 20) / 20);
    }
    stickDirection(stick, x, y, threshold = 0.6) {
        return stick.x * x + stick.y * y >= threshold;
    }
    left(stick = this.ls, threshold = 0.6) {
        return this.stickDirection(stick, -1, 0, threshold);
    }

    right(stick = this.ls, threshold = 0.6) {
        return this.stickDirection(stick, 1, 0, threshold);
    }

    up(stick = this.ls, threshold = 0.6) {
        return this.stickDirection(stick, 0, 1, threshold);
    }

    down(stick = this.ls, threshold = 0.6) {
        return this.stickDirection(stick, 0, -1, threshold);
    }
}

const input = new Input(document.getElementById("m"));

    const point = {
        x: 0,
        y: 0
    }
    const triOrder = [0, 1, 2, 0, 2, 3];


    (() => {
        const MathExtended = {
            lerp(a,b,t){
            return a+t*(b-a);
            },
            smoothMin(a, b, k = 1) {
                let h = Math.max(k - Math.abs(a - b), 0) / k;
                return Math.min(a, b) - (h * h * k) * 0.25;
            },
            smoothMax(a, b, k = 1) {
                let h = Math.max(k - Math.abs(a - b), 0) / k;
                return Math.max(a, b) + (h * h * k) * 0.25;
            },
            smoothSign(x, s) {
                return x / Math.sqrt(x * x + s * s)
            },
        };
        Object.assign(Math, MathExtended);
    })();
    const GFXUtils = {
        createMissingTex() {
            let noTexTex = new OffscreenCanvas(256, 256);
            let ntctx = noTexTex.getContext("2d");
            const ssss = 64;
            for (let y = 0; y < 256; y += ssss) {
                for (let x = 0; x < 256; x += ssss) {
                    ntctx.fillStyle = (x / ssss + y / ssss) & 1 ? "#ff00ff" : "#000000";
                    ntctx.fillRect(x, y, ssss, ssss);
                }
            }
            return noTexTex;
        },
        async toBitmap(dataUrl) {
            const bin = atob(dataUrl);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) {
                bytes[i] = bin.charCodeAt(i);
            }
            const decoder = new ImageDecoder({
                data: bytes.buffer,
                type: "image/png"
            });
            await decoder.tracks.ready;
            const frame = (await decoder.decode()).image;
            const bitmap = await createImageBitmap(frame);
            return bitmap;
        },
    }
    let noTexTex = GFXUtils.createMissingTex();



    class GLContext {
        constructor(canvas, attribs) {
            this.canvas = canvas;
            this.gl = canvas.getContext("webgl2", attribs);
            if (!this.gl) console.log("WebGL2 not supported");
        }
        createProgram(options) {
            return new Program(this.gl, options);
        }
        createMesh(options) {
            return new Mesh(this.gl, options);
        }
        createTexture(source, options = {}) {
            return new Texture(this.gl, source, options);
        }
        createRenderTarget(options = {}) {
            return new RenderTarget(this.gl, options);
        }
        createPostProcess(shaders) {
            return new PostProcess(this.gl, this.createProgram(shaders));
        }
    }
    class Program {
        constructor(gl, {
            vertex,
            fragment
        }) {
            this.gl = gl;
            const vs = this.compile(gl.VERTEX_SHADER, vertex);
            const fs = this.compile(gl.FRAGMENT_SHADER, fragment);
            this.program = gl.createProgram();
            gl.attachShader(this.program, vs);
            gl.attachShader(this.program, fs);
            gl.linkProgram(this.program);
            if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
                console.log(gl.getProgramInfoLog(this.program));
            this.uniforms = new Map();
        }
        compile(type, source) {
            const gl = this.gl;
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
                console.log(gl.getShaderInfoLog(shader));
            return shader;
        }
        use() {
            this.gl.useProgram(this.program);
        }
        uniform(name) {
            if (this.uniforms.has(name)) {
                return this.uniforms.get(name);
            }
            const loc = this.gl.getUniformLocation(this.program, name);
            this.uniforms.set(name, loc);
            return loc;
        }
    }
    class Mesh {
        constructor(gl, options = {}) {
            this.gl = gl;
            this.vao = gl.createVertexArray();
            this.attributes = {};
            this.buffers = {};
            this.vertexCount = 0;
            this.indexCount = 0;
            gl.bindVertexArray(this.vao);
            let location = 0;
            for (const [name, attribute] of Object.entries(options.attributes || {})) {
                const buffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                const data = attribute.data || [];
                gl.bufferData(
                    gl.ARRAY_BUFFER,
                    new Float32Array(data),
                    options.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW,
                );
                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(
                    location,
                    attribute.size,
                    attribute.type || gl.FLOAT,
                    attribute.normalized || false,
                    attribute.stride || 0,
                    attribute.offset || 0,
                );
                this.attributes[name] = {
                    location,
                    size: attribute.size
                };
                this.buffers[name] = buffer;
                location++;
            }
            if (options.indices) {
                this.indexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
                gl.bufferData(
                    gl.ELEMENT_ARRAY_BUFFER,
                    new Uint32Array(options.indices),
                    options.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW,
                );
                this.indexCount = options.indices.length;
            }
            gl.bindVertexArray(null);
        }
        setAttribute(name, data) {
            const gl = this.gl;
            const buffer = this.buffers[name];
            if (!buffer) {
                console.log(`Unknown attribute '${name}'`);
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
            this.vertexCount = data.length / this.attributes[name].size;
        }
        draw(mode = this.gl.TRIANGLES) {
            const gl = this.gl;
            gl.bindVertexArray(this.vao);
            if (this.indexCount > 0) {
                gl.drawElements(mode, this.indexCount, gl.UNSIGNED_INT, 0);
            } else {
                gl.drawArrays(mode, 0, this.vertexCount);
            }
        }
    }
    class Texture {
        constructor(gl, image, options = {}) {
            this.gl = gl;
            this.mipmapped = options.mipmap;
            this.texture = gl.createTexture();
            this.image;
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_MIN_FILTER,
                options.minFilter || gl.LINEAR,
            );
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_MAG_FILTER,
                options.magFilter || gl.LINEAR,
            );
            if (this.mipmapped) {
                gl.generateMipmap(gl.TEXTURE_2D);
            }
        }
        bind(unit = 0) {
            const gl = this.gl;
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
        }

        async setImage(source, level = 0) {
            const gl = this.gl;

            let image = source;

            if (typeof source === "string") {
                image = await GFXUtils.toBitmap(source);
            }

            gl.bindTexture(gl.TEXTURE_2D, this.texture);

            gl.texImage2D(
                gl.TEXTURE_2D,
                level,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image,
            );

            //  if(this.mipmapped) {
            gl.generateMipmap(gl.TEXTURE_2D);
            //}

            this.width = image.width;
            this.height = image.height;

            return image;
        }
    }
    class RenderTarget {
        constructor(
            gl,
            options, {
                width = gl.canvas.width,
                height = gl.canvas.height
            } = {},
        ) {
            this.gl = gl;
            this.width = width;
            this.height = height;
            this.framebuffer = gl.createFramebuffer();
            this.texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE9);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            const internalFormat = options.format || gl.RGBA16F;
            const type =
                internalFormat == gl.RGBA16F ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;

            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                internalFormat,
                width,
                height,
                0,
                gl.RGBA,
                type,
                null,
            );
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D,
                this.texture,
                0,
            );
            this.depthBuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
            gl.renderbufferStorage(
                gl.RENDERBUFFER,
                gl.DEPTH_COMPONENT24,
                width,
                height,
            );
            gl.framebufferRenderbuffer(
                gl.FRAMEBUFFER,
                gl.DEPTH_ATTACHMENT,
                gl.RENDERBUFFER,
                this.depthBuffer,
            );
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
        bind() {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
            //if(this.mipmapped){
            gl.generateMipmap(gl.TEXTURE_2D);
            //}
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
        unbind() {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        } 
    }
    class PostProcess {
        constructor(gl, program) {
            this.gl = gl;
            this.program = program;
            this.iChannel = this.program.uniform("iChannel0");
            this.iChannel1 = this.program.uniform("iChannel1");
            this.vao = gl.createVertexArray();
            gl.bindVertexArray(this.vao);
            const quad = new Float32Array([-1, -1, 3, -1, -1, 3]);
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
            const loc = 0;
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
            gl.bindVertexArray(null);
        }
        render(source, target = null, extra = null) {
            const gl = this.gl;
            if (target) {
                target.bind();
            } else {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }

            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            this.program.use();
            gl.activeTexture(gl.TEXTURE8);
            gl.bindTexture(gl.TEXTURE_2D, source.texture);
            gl.uniform1i(this.iChannel, 8);
            if (extra) {
                gl.activeTexture(gl.TEXTURE9);
                gl.bindTexture(gl.TEXTURE_2D, extra.texture);
                gl.uniform1i(this.iChannel1, 9);
            }
            gl.bindVertexArray(this.vao);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
    }
    class GLParticles {
        constructor(gl, maxGLParticles = 100000) {
            this.gl = gl;
            this.count = 0;
            this.data = new Float32Array(maxGLParticles * 7);

            this.vao = gl.createVertexArray();
            this.buffer = gl.createBuffer();

            gl.bindVertexArray(this.vao);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

            gl.bufferData(gl.ARRAY_BUFFER, this.data.byteLength, gl.DYNAMIC_DRAW);

            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 7 * 4, 0);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 7 * 4, 3 * 4);
            gl.bindVertexArray(null);
        }
        clear() {
            this.count = 0;
        }
        add(x, y, z, r, g, b, a) {
            const i = (this.count * 7) % this.data.length;
            this.data[i + 0] = x;
            this.data[i + 1] = y;
            this.data[i + 2] = z;
            this.data[i + 3] = r;
            this.data[i + 4] = g;
            this.data[i + 5] = b;
            this.data[i + 6] = a;
            this.count++;
        }
        draw() {
            const gl = this.gl;
            gl.bindVertexArray(this.vao);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.subarray(0, this.count * 7));
            gl.drawArrays(gl.POINTS, 0, this.count);
        }
    }
    /*
    if(window.parent.gfx==undefined){
    window.parent.gfx=new GLContext(new OffscreenCanvas(640, 360),{premultipliedAlpha: false});
    }


    let gfx=window.parent.gfx;
    */
    //GL{
    let gfx = new GLContext(new OffscreenCanvas(640, 360), {
        premultipliedAlpha: false,
    });
    const gl = gfx.gl;
    gl.getExtension("EXT_color_buffer_float");

    const mainProgram = gfx.createProgram({
        vertex: document.getElementById("vertex-shader").textContent,
        fragment: document.getElementById("fragment-shader").textContent,
    });
    gl.useProgram(mainProgram.program);

    const camMat = mainProgram.uniform("camera");
    const glLights = mainProgram.uniform("lightPos");
    const iTime = mainProgram.uniform("iTime");
    const iChannel0 = mainProgram.uniform("iChannel0");
    const iChannel1 = mainProgram.uniform("iChannel1");

    gl.uniform1i(iChannel0, 0);
    gl.uniform1i(iChannel1, 1);

    const atlas = gfx.createTexture(noTexTex, {
        minFilter: gl.NEAREST,
        magFilter: gl.NEAREST,
        mipmap: false,
    });
    const atlasNormals = gfx.createTexture(noTexTex, {
        minFilter: gl.NEAREST,
        magFilter: gl.NEAREST,
        mipmap: false,
    });

    let room1Tilemap = await atlas.setImage(room_1_tilemap);
    let room1TilemapNormal = await atlasNormals.setImage(room_1_tilemap_normal);
    atlas.bind(0);
    atlasNormals.bind(1);
    const particleProgram = gfx.createProgram({
        vertex: document.getElementById("particle-vertex").textContent,
        fragment: document.getElementById("particle-fragment").textContent,
    });
    const camMatp = particleProgram.uniform("camera");
    const worldMesh = gfx.createMesh({
        dynamic: false,
        attributes: {
            coordinates: {
                size: 3,
                data: []
            },
            uv: {
                size: 3,
                data: []
            }
        },
    });
    const entitiesMesh = gfx.createMesh({
        dynamic: true,
        attributes: {
            coordinates: {
                size: 3,
                data: []
            },
            uv: {
                size: 3,
                data: []
            }
        },
    });
    const sceneTarget = gfx.createRenderTarget({
        format: gl.RGBA16F
    });
    const ping = gfx.createRenderTarget();
    const pong = gfx.createRenderTarget();
    const bloomPass = gfx.createPostProcess({
        vertex: document.getElementById("ppfxDefault").textContent,
        fragment: document.getElementById("bloom-shader").textContent,
    });
    const boringPass = gfx.createPostProcess({
        vertex: document.getElementById("ppfxDefault").textContent,
        fragment: document.getElementById("boring-shader").textContent,
    });
    const compPass = gfx.createPostProcess({
        vertex: document.getElementById("ppfxDefault").textContent,
        fragment: document.getElementById("composite-shader").textContent,
    });
    const impactFrame = compPass.program.uniform("impactFrame");
    const posBuffer = gl.createBuffer();
    const uvBuffer = gl.createBuffer();

    //}

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    //gl.enable(gl.DEPTH_TEST);

    //gl.depthMask(false)
    gl.viewport(0, 0, 640, 360);
    gl.clearColor(0, 0, 0, 1);

    let glparticles = new GLParticles(gl);

    class TextureAtlas {
        constructor(images, maxWidth = 2048) {
            this.images = [...images];
            this.maxWidth = maxWidth;
            this.sprites = {};
            this.build();
        }
        build() {
            const images = [...this.images].sort(
                (a, b) => b.image.height - a.image.height,
            );
            let x = 0;
            let y = 0;
            let widAcc = 0;
            let rowHeight = 0;
            const placements = [];
            //Trying not to forget it is of for arrays and in for objects
            for (const entry of images) {
                const img = entry.image;
                if (x + img.width > this.maxWidth) {
                    x = 0;
                    y += rowHeight;
                    rowHeight = 0;
                }

                placements.push({
                    name: entry.name,
                    image: img,
                    x,
                    y,
                    width: img.width,
                    height: img.height,
                });
                x += img.width;
                widAcc = Math.max(widAcc, x);
                rowHeight = Math.max(rowHeight, img.height);
            }
            this.width = widAcc;
            this.height = y + rowHeight;
            this.canvas = new OffscreenCanvas(this.width, this.height);
            const ctx = this.canvas.getContext("2d");
            for (const p of placements) {
                ctx.drawImage(p.image, p.x, p.y);
                this.sprites[p.name] = {
                    x: p.x,
                    y: p.y,
                    width: p.width,
                    height: p.height,
                };
            }
        }
        getUV(name, u, v) {
            const s = this.sprites[name];
            if (!s) {
                throw new Error(`Unknown atlas sprite '${name}'`);
            }
            return {
                x: s.x + u,
                y: s.y + v
            };
        }
    }

    let entityAtlas = new TextureAtlas([{
            image: await GFXUtils.toBitmap(player_tilemap),
            name: "player"
        },
        {
            image: await GFXUtils.toBitmap(spider_tilemap),
            name: "spider"
        },
        {
            image: await GFXUtils.toBitmap(rusty_sword),
            name: "rustySword"
        },
    ]);
    let entityAtlasNormal = new TextureAtlas([{
            image: await GFXUtils.toBitmap(player_tilemap_normal),
            name: "player"
        },
        {
            image: await GFXUtils.toBitmap(spider_tilemap_normal),
            name: "spider"
        },
        {
            image: await GFXUtils.toBitmap(rusty_sword_normal),
            name: "rustySword"
        },
    ]);

    class TileSet {
        constructor() {
            this.tiles = {};
        }
        define(char, dat) {
            this.tiles[char] = dat;
            return this;
        }
        get(char) {
            return this.tiles[char];
        }
    }
    const tileSize = 64;
    class Level {
        constructor(name, slices, colliders = {}) {
            this.name = name;
            this.slices = slices;
            this.slices = this.slices.sort((a, b) => b.z - a.z);
            this.zones = colliders;
            this.ground = this.slices.find((s) => s.z == 1);
            this.colliders = this.ground.colliders;
        }
        get(x, y, z) {
            return this.slices[z].data[y][x];
        }
        get width() {
            return this.ground.data[0].length;
        }
        get height() {
            return this.ground.data.length;
        }
        pointCollision(x, y) {
            const s = this.ground;
            const tx = Math.floor(x / (tileSize * 0.5) - s.x);
            const ty = Math.floor(y / (tileSize * 0.5) - s.y);
            if (tx < 0 || ty < 0 || ty >= s.data.length || tx >= s.data[0].length) {
                return null;
            }
            const tile = s.data[s.data.length - ty - 1][tx];
            return this.colliders[tile] ?? null;
        }
        rectCollision(box) {
            const s = this.ground;
            const tile = tileSize * 0.5;

            const tx0 = Math.floor(box.x / tile - s.x);
            const ty0 = Math.floor(box.y / tile - s.y);

            const tx1 = Math.floor((box.x + box.w - 0.001) / tile - s.x);
            const ty1 = Math.floor((box.y + box.h - 0.001) / tile - s.y);

            for (let ty = ty0; ty <= ty1; ty++) {
                if (ty < 0 || ty >= s.data.length) continue;

                for (let tx = tx0; tx <= tx1; tx++) {
                    if (tx < 0 || tx >= s.data[0].length) continue;

                    const tileId = s.data[s.data.length - ty - 1][tx];
                    const collider = this.colliders[tileId];

                    if (collider) {
                        return collider;
                    }
                }
            }

            return null;
        }
        raycast(ox, oy, dx, dy) {
            const s = this.ground;
            const tileSize = 64;
            let tx = Math.floor(ox / tileSize - s.x);
            let ty = Math.floor(oy / tileSize - s.y);

            const stepX = Math.sign(dx);
            const stepY = Math.sign(dy);

            const deltaX = dx !== 0 ? Math.abs(tileSize / dx) : Infinity;
            const deltaY = dy !== 0 ? Math.abs(tileSize / dy) : Infinity;

            let sideX, sideY;

            const side = (p, t, d, o) => d ? (((t + (d > 0) + o) * tileSize) - p) / d : Infinity;

            sideX = side(ox, tx, dx, s.x);
            sideY = side(oy, ty, dy, s.y);
            let nx = 0;
            let ny = 0;
            let lt = 0;
            for (var i = 0; i < 1000; i++) {
                if (tx < 0 || ty < 0 || ty >= s.data.length || tx >= s.data[0].length) {
                    return null;
                }

                const tile = s.data[s.data.length - ty - 1][tx];

                const collider = this.colliders[tile];
                let t = Math.min(sideX, sideY);
                if (collider) {
                    return {
                        tile,
                        collider,
                        x: ox + dx * lt,
                        y: oy + dy * lt,
                        distance: lt,
                        normal: {
                            x: nx,
                            y: ny
                        },
                    };
                }
                lt = t;
                if (sideX < sideY) {
                    sideX += deltaX;
                    tx += stepX;
                    nx = -stepX;
                    ny = 0;
                } else {
                    sideY += deltaY;
                    ty += stepY;
                    nx = 0;
                    ny = -stepY;
                }
            }
        }
        buildMesh(tileSet) {
            const vb = [];
            const ub = [];
            for (let z = 0; z < this.slices.length; z++) {
                const slice = this.slices[z];
                for (let y = 0; y < slice.data.length; y++) {
                    const row = slice.data[slice.data.length - y - 1];
                    for (let x = 0; x < row.length; x++) {
                        const tile = tileSet.get(row[x]);
                        if (!tile) {
                            continue;
                        }
                        let x1 = (x + slice.x) * tileSize * 0.5;
                        let y1 = (y + slice.y) * tileSize * 0.5;
                        let z1 = slice.z;
                        const u0 = tile.x;
                        const v0 = tile.y;
                        const u1 = u0 + tile.w;
                        const v1 = v0 + tile.h;
                        vb.push(x1, y1, z1, x1 + tile.w * 0.5, y1, z1, x1, y1 + tile.h * 0.5, z1, x1 + tile.w * 0.5, y1, z1, x1 + tile.w * 0.5, y1 + tile.h * 0.5, z1, x1, y1 + tile.h * 0.5, z1, );
                        ub.push(u0, v1, z1, u1, v1, z1, u0, v0, z1, u1, v1, z1, u1, v0, z1, u0, v0, z1, );
                    }
                }
            }
            return {
                coordinates: new Float32Array(vb),

                uv: new Float32Array(ub),
            };
        }
    }
    //Muahahahhahaa formatting.  Looks stupid but works cause js doesn't care what you do apparently.
    const tiles = new TileSet()
        .define("a", { x: 64, y: 64, w: 64, h: 64 })
        .define("b", { x: 128, y: 64, w: 64, h: 64 })
        .define("c", { x: 128, y: 0, w: 64, h: 64 })
        .define("d", { x: 64, y: 0, w: 64, h: 64 })
        .define("e", { x: 0, y: 0, w: 64, h: 64 })
        .define("f", { x: 0, y: 64, w: 64, h: 64 })
        .define("g", { x: 0, y: 128, w: 64, h: 64 })
        .define("h", { x: 64, y: 128, w: 64, h: 64 })
        .define("i", { x: 128, y: 128, w: 64, h: 64 })
        .define("j", { x: 128 + 64, y: 0, w: 64, h: 64 })
        .define("k", { x: 128 + 64, y: 64, w: 64, h: 64 })
        .define("l", { x: 256, y: 0, w: 64, h: 64 })
        .define("m", { x: 256, y: 64, w: 64, h: 64 })
        .define("n", { x: 256, y: 128, w: 64, h: 64 })

    const levelData = [{
            x: 0,
            y: 0,
            z: 0.5,
            data: [
                "           l       l       a l      ",
                "           m       m       h m      ",
                "           m       m         m      ",
                "           m       m         m      ",
                "           m    h  m         m      ",
                "           n    a  n         n      ",
            ],
        },
        {
            x: 0,
            y: 0,
            z: 1,
            data: [
                "hi  ghhhhhhhhhhhhhhhhhhhhhhhhhhhhhha",
                "b         faab                     f",
                "b         ghhi                     g",
                "b                                   ",
                "b                                   ",
                "adddddddddddddadddaadddaadddddadaadd",
            ],
            colliders: {
                a: true,
                b: true,
                c: true,
                d: true,
                e: true,
                f: true,
                g: true,
                h: true,
                i: true, 
            },
        },

        {
            x: 0,
            y: -1,
            z: 1.5,
            data: [
                " l      l      l        l        l  ",
                " m      m      m  ha    m  h     m f",
                " m      m      m   h    m        m f",
                " m      m      m        m        m  ",
                " m      m      m        m        m  ",
                " m      m      m        m        m  ",
                " m      m      m  d     m    ec  m  ",
                " n      n      n        n        n  ",
            ],
        },
        {
            x: 0,
            y: -1,
            z: 0.75,
            data: [
                "                                     ",
                "                        j            ",
                "                        k            ",
                "                                     ",
                "                                     ",
                "                                     ",
                "                                     ",
                "                                     ",
            ],
        },
        {
            x: 0,
            y: -1,
            z: 1.25,
            data: [
                "                                    ",
                "     j          j               j   ",
                "     k          k               k   ",
                "                                    ",
                "                                    ",
                "                                    ",
                "                                    ",
                "                                    ",
            ],
        },
        {
            x: -4,
            y: -1,
            z: 2,
            data: [
                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaahaaaaaaa",
                "aaaaaaaaaaaahaaaaaaahaaaaaaaaaabfaahaaaaaaaa",
                "aaaabfaaaaaadaaaaaaadaabfaaaaaaaaaaaaaaaaaaa",
                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaahaa",
                "aaahaaabfaahaabfaahaaaaaahaaaabfaaaaaadaaaaa",
                "aaadaaaaaaadaaaaaadaabfaadaaaaaahaaaaahaaaaa",
                "aaaaaaaaaaaaaaahaaaaahaaaaaaaaabfaaaaaadaaaa",
                "aaaaaaabfaaaaaadaaaaadaaabfaaaaaaaahaaaaaaaa",
                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaadaabfaaaaaaaa",
            ],
        },
    ];

    const level = new Level("test room", levelData, {
        lights: new Float32Array([527, 147, 1.25, 526 + 256, 147, 0.75, 526 + 512, 147, 1.25])
    });

    const meshData = level.buildMesh(tiles);

    worldMesh.setAttribute("coordinates", meshData.coordinates);
    worldMesh.setAttribute("uv", meshData.uv);

    const PhysUtils = {
        solveConstraint(ts, x, y, a, b = null) {
            if (!b) {
                //No second point here, nice and easy lol
                const dx = x - a.x;
                const dy = y - a.y;
                const len = Math.hypot(dx, dy);
                if (len === 0) {
                    return {
                        x: a.x + a.d,
                        y: a.y
                    };
                }

                const s = a.d / len;
                return {
                    x: a.x + dx * s,
                    y: a.y + dy * s
                };
            }
            // Two points omg
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);
            const r0 = a.d;
            const r1 = b.d;

            // Fallback case hopefully not necessary.  These comments are for me btw
            if (dist > r0 + r1 || dist < Math.abs(r0 - r1) || dist == 0) {
                const p0 = PhysUtils.solveConstraint(ts, x, y, a);
                const p1 = PhysUtils.solveConstraint(ts, x, y, b);
                return {
                    x: (p0.x + p1.x) * 0.5,
                    y: (p0.y + p1.y) * 0.5
                };
            }
            const d2 = dist * dist;
            const aLen = (r0 * r0 - r1 * r1 + d2) / (2 * dist); //Distance along ab vector the solution points chord is.
            const h = Math.sqrt(r0 * r0 - aLen * aLen); //distance to each intersect
            const px = a.x + (dx * aLen) / dist;
            const py = a.y + (dy * aLen) / dist;
            const rx = (-dy * h) / dist;
            const ry = (dx * h) / dist;
            const ix1 = px + rx; //int 1
            const iy1 = py + ry;
            const ix2 = px - rx; //int 2
            const iy2 = py - ry;
            const dotdv =
                ts.desiredVector.x * (ix1 - ix2) + ts.desiredVector.y * (iy1 - iy2);
            //POSSIBLE PROBLEM LOOK HERE DONT FOREGET

            return dotdv < 0 ? {
                x: ix1,
                y: iy1
            } : {
                x: ix2,
                y: iy2
            }; //pick closest
        },
        solveEnds(ts, c, r) {
            let dx = ts.x - c.x;
            let dy = ts.y - c.y;
            const mag = Math.hypot(dx, dy);

            if (mag <= r || mag == 0) {
                return ts;
            }
            dx /= mag;
            dy /= mag;
            let out = {
                x: c.x + dx * r,
                y: c.y + dy * r
            };
            ts.x = out.x;
            ts.y = out.y;
            let velDot = ts.xv * dx + ts.yv * dy;
            if (velDot > 0) {
                ts.xv -= velDot * dx * 0.5;
                ts.yv -= velDot * dy * 0.5;
            }
            return out;
        },
        rotateFromReference(mod, init, curr, ic, c, p) {
            //I feel like a real shadertoyian with these variable names.
            const ax = init.x - ic.x;
            const ay = init.y - ic.y;

            const bx = curr.x - c.x;
            const by = curr.y - c.y;

            const al = Math.hypot(ax, ay);
            const bl = Math.hypot(bx, by);

            if (al == 0 || bl == 0) {
                return {
                    x: p.x,
                    y: p.y
                };
            }
            const inv = 1 / (al * bl);
            const cos = (ax * bx + ay * by) * inv;
            const sin = (ax * by - ay * bx) * inv;

            const px = p.x - ic.x;
            const py = p.y - ic.y;
            mod.x = c.x + px * cos - py * sin
            mod.y = c.y + px * sin + py * cos
        },
        springPhys(body, tx, ty, strength, damping) {
            const dx = tx - body.x;
            const dy = ty - body.y;
            body.xv += dx * strength;
            body.yv += dy * strength;
            body.xv *= damping;
            body.yv *= damping;
            body.x += body.xv;
            body.y += body.yv;
            return body;
        },
        parentRefVector(mod, ts, v) {
            let parv = {
                x: ts.parents[0].x - ts.parents[1].x,
                y: ts.parents[0].y - ts.parents[1].y,
            };
            let mag = Math.hypot(parv.x, parv.y);
            parv.x /= mag;
            parv.y /= mag;
            //x' = xcos(theta) - ysin(theta)
            //y' = xsin(theta) + ycos(theta)
            mod.x = v.x * parv.x - v.y * parv.y
            mod.y = v.x * parv.y + v.y * parv.x
        },
    }
    class Box {
        constructor(x, y, w, h) {
            this.x = Math.min(x, x + w);
            this.y = Math.min(y, y + h);
            this.w = Math.abs(w);
            this.h = Math.abs(h);
        }
        get max() {
            return {
                x: this.x + this.w,
                y: this.y + this.h
            };
        }
        get min() {
            return {
                x: this.x,
                y: this.y
            };
        }
        get ll() {
            return {
                x: this.x,
                y: this.y
            };
        }
        get lr() {
            return {
                x: this.x + this.w,
                y: this.y
            };
        }
        get tl() {
            return {
                x: this.x,
                y: this.y + this.h
            };
        }
        get tr() {
            return {
                x: this.x + this.w,
                y: this.y + this.h
            };
        }
        get cx() {
            return this.x + this.w / 2;
        }
        get cy() {
            return this.y + this.h / 2;
        }
    }
    class Node {
        constructor(x, y, type, dv, parents, name) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.parentIndices = parents;
            this.desiredVector = dv;
            this.parents = [];
            this.distances = [0, 0];
            this.name = name;
        }
        defineRest(nodes) {
            this.parents = this.parentIndices.map((i) => nodes[i]);

            for (var i = 0; i < this.parents.length; i++) {
                this.distances[i] = Math.hypot(
                    this.x - this.parents[i].x,
                    this.y - this.parents[i].y,
                );
                this.parents[i].d = this.distances[i];
            }
        }
        set xy(vect) {
            this.x = vect.x;
            this.y = vect.y;
        }
        solve() {
            if (this.type == "child") {
                let res = PhysUtils.solveConstraint(
                    this,
                    this.x,
                    this.y,
                    this.parents[0],
                    this.parents[1],
                );
                this.x = res.x;
                this.y = res.y;
            }
        }
        clone() {
            return new Node(
                this.x,
                this.y,
                this.type, {
                    ...this.desiredVector
                },
                [...this.parentIndices],
                this.name,
            );
        }
    }
    class Limb {
        constructor(x, y, w, h, nodes, name) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.nodes = nodes;
            this.name = name;
            this.limbVerts = [{
                    x: this.x,
                    y: this.y
                },
                {
                    x: this.x + this.w,
                    y: this.y
                },
                {
                    x: this.x + this.w,
                    y: this.y + this.h
                },
                {
                    x: this.x,
                    y: this.y + this.h
                },
            ];
        }
        update() {}
        clone() {
            return new Limb(this.x, this.y, this.w, this.h, [...this.nodes], this.name);
        }
    }



    class Entity {
        constructor(nodes, limbs, z, name) {
            this.nodes = nodes;
            for (var i = 0; i < this.nodes.length; i++) {
                this.nodes[i].defineRest(this.nodes);
            }
            this.limbs = limbs;
            this.templateNodes = nodes.map((n) => n.clone());
            this.templateLimbs = limbs.map((l) => l.clone());
            this.z = z;
            this.name = name;
            let lx = Infinity;
            let ly = Infinity;
            let mx = -Infinity;
            let my = -Infinity;
            for (var i = 0; i < limbs.length; i++) {
                lx = Math.min(lx, limbs[i].x);
                ly = Math.min(ly, limbs[i].y);
                mx = Math.max(mx, limbs[i].x + limbs[i].w);
                my = Math.max(my, limbs[i].y + limbs[i].h);
            }
            this.hitbox = new Box(lx, ly, (lx - mx) / 2, (ly - my) / 2);

            this.hitbox.xv = 0;
            this.hitbox.yv = 0;
            this.hitbox.totalv = 0;
            this.hitbox.ptotalv = 0;
            this.hitbox.onGround = false;
            this.vertices = new Float32Array(this.limbs.length * 18);
            this.uvs = [];
        }
        solveAxis(dx, dy, level) {
            const tile = tileSize * 0.5;

            this.hitbox.x += dx;
            this.hitbox.y += dy;

            if (!level.rectCollision(this.hitbox)) return;

            if (dx) {
                const sx = Math.sign(dx);

                this.hitbox.x = (Math.floor((sx > 0 ? this.hitbox.x + this.hitbox.w : this.hitbox.x) / tile) + (sx < 0)) * tile - (sx > 0) * this.hitbox.w;

                this.hitbox.xv = 0;
            }

            if (dy) {
                const sy = Math.sign(dy);

                this.hitbox.y = (Math.floor((sy > 0 ? this.hitbox.y + this.hitbox.h : this.hitbox.y) / tile) + (sy < 0)) * tile - (sy > 0) * this.hitbox.h;

                this.hitbox.yv = 0;
                this.hitbox.onGround = sy < 0;
            }
        }
        translate(x, y) {
            this.hitbox.x = x;
            this.hitbox.y = y;
        }
        assignUvs(box, z) {
            this.uvs = [];
            const triOrder = [3, 2, 1, 3, 1, 0];
            let boxes = [...box]
            this.limbs = this.limbs
                .map((limb, index) => ({
                    limb,
                    index
                }))
                .sort((a, b) => boxes[b.index].z - boxes[a.index].z)
                .map((x) => x.limb);
            boxes.sort((a, b) => b.z - a.z);
            for (var i = 0; i < boxes.length; i++) {
                let box = boxes[i];
                let uvt = [{
                        x: box.x,
                        y: box.y
                    },
                    {
                        x: box.x + this.limbs[i].w,
                        y: box.y
                    },
                    {
                        x: box.x + this.limbs[i].w,
                        y: box.y + this.limbs[i].h
                    },
                    {
                        x: box.x,
                        y: box.y + this.limbs[i].h
                    },
                ];
                for (var j = 0; j < 6; j++) {
                    let newCoord = entityAtlas.getUV(
                        this.name,
                        uvt[triOrder[j]].x,
                        uvt[triOrder[j]].y,
                    );
                    this.uvs.push(newCoord.x, newCoord.y, box.z + z);
                }
            }

        }
        constructVertexArray() {


            for (var i = 0; i < this.limbs.length; i++) {
                let limb = this.limbs[i];
                for (var j = 0; j < 6; j++) {
                    //(init,curr,ic,c,p)
                    PhysUtils.rotateFromReference(
                        point,
                        this.templateNodes[limb.nodes[1]],
                        this.nodes[limb.nodes[1]],
                        this.templateNodes[limb.nodes[0]],
                        this.nodes[limb.nodes[0]],
                        limb.limbVerts[triOrder[j]],
                    );
                    this.vertices[i * 18 + j * 3] = point.x / 2;
                    this.vertices[i * 18 + j * 3 + 1] = point.y / 2;
                    this.vertices[i * 18 + j * 3 + 2] = this.z + this.uvs[i * 18 + j * 3 + 2] / 2000;
                }
            }
        }
        updateFeet(feet, tolerance) {
            //miazaki reference
            if (Math.abs(this.hitbox.xv) < 0.08) {
                //  ||Math.abs(this.hitbox.totalv-this.hitbox.ptotalv)<0.00001
                for (const foot of feet) {
                    foot.tx = this.hitbox.cx * 2 + foot.offsetX;
                    foot.ty = this.hitbox.cy * 2 + foot.offsetY;
                    let fland = level.raycast(foot.tx, foot.ty + 17, 0, -1);

                    if (fland) {
                        foot.ty = fland.y;
                    }
                }
                return;
            } else {
                for (const foot of feet) {
                    let pottx = this.hitbox.cx * 2 + tolerance * Math.smoothSign(this.hitbox.xv, 1) + foot.offsetX / 2.5;

                    let fland = level.raycast(pottx, foot.y + 17, 0, -1);

                    if (fland && Math.abs(fland.y - foot.y) < 38) {
                        let ref = feet.toSorted(
                            (a, b) => -(Math.abs(a.tx - fland.x) - Math.abs(b.tx - fland.x)),
                        );

                        if (Math.abs(ref[1].tx - fland.x) > tolerance / 1 && Math.abs(foot.tx - this.hitbox.cx * 2 - foot.offsetX / 2.5) > tolerance) {
                            foot.tx = fland.x;
                            foot.ty = fland.y + 1;
                        }
                    } else {
                        foot.tx += this.hitbox.xv;
                        foot.ty += this.hitbox.yv;
                        let fland = level.raycast(foot.tx, foot.ty + 17, 0, -1);

                        if (fland) {
                            foot.ty = fland.y;
                        }
                    }
                }
            }
        }
    }
    class Weapon {
        constructor(owner, node1, node2, x, y, w, h, name) {
            this.name = name;
            this.owner = owner;
            this.nodeP = node1;
            this.nodeA = node2;
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.angle = Math.PI / 2-0.5+ Math.random() * 0.1
            this.z = this.owner.z - 0.0005;
            this.refPoints = [{
                    x: this.x,
                    y: this.y
                },
                {
                    x: this.x + w,
                    y: this.y
                },
                {
                    x: this.x + w,
                    y: this.y + h
                },
                {
                    x: this.x,
                    y: this.y + h
                },
            ];
            const cx = this.x + w / 2;
            const cy = this.y + h / 2;
            const c = Math.cos(this.angle);
            const s = Math.sin(this.angle);
            for (const p of this.refPoints) {
                const x = p.x - cx;
                const y = p.y - cy;

                p.x = cx + x * c - y * s;
                p.y = cy + x * s + y * c;
            }
            this.vertices = new Float32Array(18);
            this.uvs = new Float32Array(18);
            this.assignUvs();
        }
        assignUvs() {
            let uvt = [{
                x: 0,
                y: 0
            }, {
                x: this.w,
                y: 0
            }, {
                x: this.w,
                y: this.h
            }, {
                x: 0,
                y: this.h
            }]
            for (var i = 0; i < 6; i++) {
                let newCoord = entityAtlas.getUV(
                    this.name,
                    uvt[triOrder[i]].x,
                    uvt[triOrder[i]].y,
                );
                this.uvs[i * 3] = newCoord.x;
                this.uvs[i * 3 + 1] = newCoord.y;
                this.uvs[i * 3 + 2] = this.z;
            }
        }
        displayHitbox() {

            glparticles.add(this.vertices[0], this.vertices[1], 0.99, 0, 1, 1, 1);
            glparticles.add(this.vertices[3], this.vertices[4], 0.99, 0, 1, 1, 1);
            glparticles.add(this.vertices[6], this.vertices[7], 0.99, 0, 1, 1, 1);
            glparticles.add(this.vertices[9], this.vertices[10], 0.99, 0, 1, 1, 1);
        }
        constructVertexArray() {

            for (var i = 0; i < 6; i++) {
                //(init,curr,ic,c,p)
                PhysUtils.rotateFromReference(
                    point,
                    this.owner.templateNodes[this.nodeP],
                    this.owner.nodes[this.nodeP],
                    this.owner.templateNodes[this.nodeA],
                    this.owner.nodes[this.nodeA],
                    this.refPoints[triOrder[i]],
                );

                this.vertices[i * 3] = point.x / 2;
                this.vertices[i * 3 + 1] = point.y / 2;
                this.vertices[i * 3 + 2] = this.z;

            }
        }
    }
    const EntityUV = {
        ArachnidBoss: [{ x: 0, y: 0, z: -0.5 }, { x: 136, y: 0, z: 0 }, { x: 121, y: 0, z: 0 }, { x: 136, y: 0, z: 0 }, { x: 121, y: 0, z: 0 }, { x: 136, y: 0, z: 0 }, { x: 121, y: 0, z: 0 }, { x: 136, y: 0, z: 0 }, { x: 121, y: 0, z: 0 }, { x: 136, y: 0, z: -1 }, { x: 121, y: 0, z: -1 }, { x: 136, y: 0, z: -1 }, { x: 121, y: 0, z: -1 }, { x: 136, y: 0, z: -1 }, { x: 121, y: 0, z: -1 }, { x: 136, y: 0, z: -1 }, { x: 121, y: 0, z: -1 }, ],
        Humanoid: [{ x: 0, y: 0, z: 0 }, { x: 53, y: 0, z: -1 }, { x: 84, y: 0, z: 1 }, { x: 52, y: 34, z: -0.5 }, { x: 83, y: 34, z: 0.95 }, { x: 48, y: 66, z: 0.1 }, { x: 78, y: 66, z: 0.2 }, { x: 48, y: 103, z: 0.8 }, { x: 78, y: 103, z: 0.9 }, ]

    };

    class Humanoid extends Entity {
        constructor(x, y, z, name) {
            let previewNodes = [
                new Node(0, 60, "root", { x: 0, y: -1 }, [], "bodyRoot"),
                new Node(0, 80, "root", { x: 0, y: -1 }, [], "bodyTap"),
                new Node(-1, 86, "root", { x: 0, y: -1 }, [], "armF"),
                new Node(-1, 86, "root", { x: 0, y: -1 }, [], "armB"),
                new Node(-1, 70, "child", { x: 1, y: 0 }, [2, 6], "elbowF"),
                new Node(-1, 70, "child", { x: 1, y: 0 }, [3, 7], "elbowB"),
                new Node(5, 45, "root", { x: 0, y: -1 }, [], "handF"),
                new Node(5, 45, "root", { x: 0, y: -1 }, [], "handB"),
                new Node(0, 55, "root", { x: 0, y: -1 }, [], "thighF"),
                new Node(0, 55, "root", { x: 0, y: -1 }, [], "thighB"),
                new Node(0, 32, "child", { x: -1, y: 0 }, [8, 12], "kneeF"),
                new Node(0, 32, "child", { x: -1, y: 0 }, [9, 13], "kneeB"),
                new Node(0, 0, "root", { x: 0, y: -1 }, [], "footF"),
                new Node(0, 0, "root", { x: 0, y: -1 }, [], "footB"),
            ];
            let previewLimbs = [
                new Limb(-16, 52, 32, 76, [0, 1, 2, 3, 8, 9], "body"),
                new Limb(-8, 66, 15, 28, [2, 4], "armF"),
                new Limb(-8, 66, 15, 28, [3, 5], "armB"),
                new Limb(-8, 41, 20, 34, [4, 6], "handF"),
                new Limb(-8, 41, 20, 34, [5, 7], "handB"),
                new Limb(-12, 27, 24, 38, [8, 10], "thighF"),
                new Limb(-12, 27, 24, 38, [9, 11], "thighB"),
                new Limb(-10, 0, 28, 40, [10, 12], "footF"),
                new Limb(-10, 0, 28, 40, [11, 13], "footB"),
            ];
            super(previewNodes, previewLimbs, z, name);
            this.translate(x, y);
            this.assignUvs(EntityUV.Humanoid, -1);
            let endNodes = ["handF", "handB", "footF", "footB"];
            this.ends = [];
            for (var i = 0; i < this.nodes.length; i++) {
                let node = this.nodes[i];
                if (endNodes.includes(node.name)) {
                    node.xv = 0;
                    node.yv = 0;
                    this.ends.push(i);
                }
            }

            this.pickInitFunction("arm")(this, 6);
            this.pickInitFunction("arm")(this, 7);
            this.pickInitFunction("leg")(this, 12);
            this.pickInitFunction("leg")(this, 13);
            this.hitbox.hh = this.hitbox.h;
            this.tic = 0;
        }
        displayHitbox() {
            let hb = this.hitbox;

            glparticles.add(hb.x, hb.y, 0.99, 0, 1, 1, 1);
            glparticles.add(hb.x + hb.w, hb.y, 0.99, 0, 1, 1, 1);
            glparticles.add(hb.x + hb.w, hb.y + hb.h, 0.99, 0, 1, 1, 1);
            glparticles.add(hb.x, hb.y + hb.h, 0.99, 0, 1, 1, 1);
        }
        updateHitbox() {
            this.hitbox.onGround = false;
            this.hitbox.yv -= 0.2;
            if (Math.abs(this.hitbox.xv) > Math.abs(this.hitbox.yv)) {
                this.solveAxis(this.hitbox.xv, 0, level);
                this.solveAxis(0, this.hitbox.yv, level);
            } else {
                this.solveAxis(0, this.hitbox.yv, level);
                this.solveAxis(this.hitbox.xv, 0, level);
            }
            this.hitbox.xv *= this.hitbox.onGround ? 0.92 : 0.98;
            this.hitbox.yv *= 0.99;
            this.nodes[0].x = this.hitbox.cx * 2;
            this.nodes[0].y = (this.hitbox.y + this.hitbox.hh * 0.5) * 2 - 2;
            this.nodes[1].x = this.hitbox.cx * 2 + this.hitbox.xv;
            this.nodes[1].y = (this.hitbox.y + this.hitbox.hh * 0.5) * 2 + 10;
        }
        static updateFunctions = {
            normalMovement: {
                //this-thi, fish-fih
                arm(thi, ind) {
                    let curNode = thi.nodes[ind];

                    curNode.c = {
                        x: thi.nodes[ind - 4].x,
                        y: thi.nodes[ind - 4].y
                    };
                    PhysUtils.parentRefVector(thi.nodes[ind - 2].desiredVector, thi.nodes[ind - 2], {
                        x: 0,
                        y: -1
                    });
                    
                    if(ind==6){
                      PhysUtils.springPhys(
                        curNode,
                        thi.hitbox.cx*2+input.rs.x*50+5,
                        thi.hitbox.cy*2+input.rs.y*75-9,
                        0.1, 
                        0.8,
                    );  
                    }else{
                        PhysUtils.springPhys(
                            curNode,
                            thi.nodes[-ind + 19].x + thi.hitbox.xv * 9.3 + Math.abs(thi.hitbox.xv) * 9 + 5,
                            thi.nodes[-ind + 19].y + 20 - thi.hitbox.yv * 1,
                            0.05,
                            0.8,
                        );
                    }
                },
                leg(thi, ind) {
                    let curNode = thi.nodes[ind];
                    curNode.r = thi.hitbox.hh - 10;
                    curNode.tx += thi.hitbox.xv * 0.8 * (1 - Math.abs(thi.hitbox.ptotalv - thi.hitbox.totalv) * 1.5);
                    curNode.c = {
                        x: thi.nodes[ind - 4].x,
                        y: thi.nodes[ind - 4].y
                    };
                    PhysUtils.parentRefVector(thi.nodes[ind - 2].desiredVector, thi.nodes[ind - 2], {
                        x: 0,
                        y: 1
                    });
                    PhysUtils.springPhys(
                        curNode,
                        curNode.tx,
                        curNode.ty - thi.hitbox.yv * 1,
                        0.015 + Math.abs(thi.hitbox.xv) * 0.019 + Math.abs(thi.hitbox.yv * 0.019),
                        0.88,
                    );
                },
            },
        };
        pickUpdateFunction(name, action) {
            return Humanoid.updateFunctions[action][name];
        }
        static initFunctions = {
            arm(thi, ind) {
                let curNode = thi.nodes[ind];
                curNode.c = {
                    x: thi.nodes[ind - 4].x,
                    y: thi.nodes[ind - 4].y
                };
                curNode.r = Math.hypot(curNode.x - curNode.c.x, curNode.y - curNode.c.y) - 0.1;
            },
            leg(thi, ind) {
                let curNode = thi.nodes[ind];
                curNode.tx = curNode.x;
                curNode.ty = curNode.y;
                curNode.offsetX = 0;
                curNode.offsetY = -64;
                curNode.c = {
                    x: thi.nodes[ind - 4].x,
                    y: thi.nodes[ind - 4].y
                };
                curNode.r = Math.hypot(curNode.x - curNode.c.x, curNode.y - curNode.c.y) - 0.1;
            },
        };
        pickInitFunction(name) {
            return Humanoid.initFunctions[name];
        }
        updateNodes() {
            //PhysUtils.springPhys(body, tx, ty, strength, damping)

            this.hitbox.ptotalv = this.hitbox.totalv;
            this.hitbox.totalv = Math.hypot(this.hitbox.xv, this.hitbox.yv);

            this.updateFeet([this.nodes[12], this.nodes[13]], 8 + Math.abs(this.hitbox.xv) * 14, );
            this.hitbox.ht = 64 - Math.abs(this.hitbox.xv) * 2 + Math.min(this.hitbox.yv, 0) * 4;
            this.hitbox.hh -= (this.hitbox.hh - this.hitbox.ht) / 8.0;
            this.hitbox.hh = Math.max(this.hitbox.hh, 58);

            for (var i = 0; i < this.limbs.length; i++) {
                let limb = this.limbs[i];
                for (var j = 0; j < limb.nodes.length; j++) {
                    let node = this.nodes[limb.nodes[j]];

                    if (node.type == "root" && j > 1) {
                        PhysUtils.rotateFromReference(
                            point,
                            this.templateNodes[limb.nodes[1]],
                            this.nodes[limb.nodes[1]],
                            this.templateNodes[limb.nodes[0]],
                            this.nodes[limb.nodes[0]],
                            this.templateNodes[limb.nodes[j]],
                        );

                        node.x = point.x;
                        node.y = point.y;
                    }
                }
            }
            this.pickUpdateFunction("arm", "normalMovement")(this, 6);
            this.pickUpdateFunction("arm", "normalMovement")(this, 7);
            this.pickUpdateFunction("leg", "normalMovement")(this, 12);
            this.pickUpdateFunction("leg", "normalMovement")(this, 13);

            for (var i = 0; i < this.ends.length; i++) {
                let node = this.nodes[this.ends[i]];
                //PhysUtils.solveEnds(ts,c,r)
                PhysUtils.solveEnds(node, node.c, node.r);
            }
            for (var i = 0; i < this.nodes.length; i++) {
                this.nodes[i].solve();
            }


        }
    }
    class ArachnidBoss extends Entity {
        constructor(x, y, z, name) {
            let previewNodes = [
                new Node(0, 100, "root", { x: 0, y: -1 }, [], "bodyRoot"),
                new Node(0, 120, "root", { x: 0, y: -1 }, [], "bodyTap"),
                new Node(-56, 72, "root", { x: 0, y: -1 }, [], "legR1"),
                new Node(-56, 48, "child", { x: 0, y: -1 }, [2, 4], "kneeR1"),
                new Node(-56, 8, "root", { x: 0, y: -1 }, [], "footR1"),
                new Node(-52, 72, "root", { x: 0, y: -1 }, [], "legR2"),
                new Node(-52, 48, "child", { x: 0, y: -1 }, [5, 7], "kneeR2"),
                new Node(-52, 8, "root", { x: 0, y: -1 }, [], "footR2"),
                new Node(-48, 72, "root", { x: 0, y: -1 }, [], "legR3"),
                new Node(-48, 48, "child", { x: 0, y: -1 }, [8, 10], "kneeR3"),
                new Node(-48, 8, "root", { x: 0, y: -1 }, [], "footR3"),
                new Node(-44, 72, "root", { x: 0, y: -1 }, [], "legR4"),
                new Node(-44, 48, "child", { x: 0, y: -1 }, [11, 13], "kneeR4"),
                new Node(-44, 8, "root", { x: 0, y: -1 }, [], "footR4"),
                new Node(56, 72, "root", { x: 0, y: -1 }, [], "legL1"),
                new Node(56, 48, "child", { x: 0, y: -1 }, [14, 16], "kneeL1"),
                new Node(56, 8, "root", { x: 0, y: -1 }, [], "footL1"),
                new Node(52, 72, "root", { x: 0, y: -1 }, [], "legL2"),
                new Node(52, 48, "child", { x: 0, y: -1 }, [17, 19], "kneeL2"),
                new Node(52, 8, "root", { x: 0, y: -1 }, [], "footL2"),
                new Node(48, 72, "root", { x: 0, y: -1 }, [], "legL3"),
                new Node(48, 48, "child", { x: 0, y: -1 }, [20, 22], "kneeL3"),
                new Node(48, 8, "root", { x: 0, y: -1 }, [], "footL3"),
                new Node(44, 72, "root", { x: 0, y: -1 }, [], "legL4"),
                new Node(44, 48, "child", { x: 0, y: -1 }, [23, 25], "kneeL4"),
                new Node(44, 8, "root", { x: 0, y: -1 }, [], "footL4")
            ];

            let previewLimbs = [
                new Limb(-60, 64, 120, 104, [0, 1, 2, 5, 8, 11, 14, 17, 20, 23], "body"),
                new Limb(-64, 40, 16, 40, [2, 3], "legL1"),
                new Limb(-64, 0, 16, 56, [3, 4], "footR1"),
                new Limb(-60, 40, 16, 40, [5, 6], "legR2"),
                new Limb(-60, 0, 16, 56, [6, 7], "footR2"),
                new Limb(-56, 40, 16, 40, [8, 9], "legR3"),
                new Limb(-56, 0, 16, 56, [9, 10], "footR3"),
                new Limb(-52, 40, 16, 40, [11, 12], "legR4"),
                new Limb(-52, 0, 16, 56, [12, 13], "footR4"),
                new Limb(48, 40, 16, 40, [14, 15], "legL1"),
                new Limb(48, 0, 16, 56, [15, 16], "footL1"),
                new Limb(44, 40, 16, 40, [17, 18], "legL2"),
                new Limb(44, 0, 16, 56, [18, 19], "footL2"),
                new Limb(40, 40, 16, 40, [20, 21], "legL3"),
                new Limb(40, 0, 16, 56, [21, 22], "footL3"),
                new Limb(36, 40, 16, 40, [23, 24], "legL4"),
                new Limb(36, 0, 16, 56, [24, 25], "footL4")
            ];
            super(previewNodes, previewLimbs, z, name);
            this.translate(x, y);
            this.assignUvs(EntityUV.ArachnidBoss, 1);

            //███████████ Add all limb ends here!!
            let endNodes = ["footR1", "footR2", "footR3", "footR4", "footL1", "footL2", "footL3", "footL4"];
            this.ends = [];
            for (var i = 0; i < this.nodes.length; i++) {
                let node = this.nodes[i];
                if (endNodes.includes(node.name)) {
                    node.xv = 0;
                    node.yv = 0;
                    this.ends.push(i);
                }
            }
            //███████████ Init limbs accordingly
            this.hitbox.h -= 20;
            for (var i = 0; i < 8; i++) {
                this.pickInitFunction("leg")(this, i * 3 + 4);
            }
            this.hitbox.hh = this.hitbox.h;
            this.tic = 0;
        }
        displayHitbox() {
            let hb = this.hitbox;

            glparticles.add(hb.x, hb.y, 0.99, 0, 1, 1, 1);
            glparticles.add(hb.x + hb.w, hb.y, 0.99, 0, 1, 1, 1);
            glparticles.add(hb.x + hb.w, hb.y + hb.h, 0.99, 0, 1, 1, 1);
            glparticles.add(hb.x, hb.y + hb.h, 0.99, 0, 1, 1, 1);

        }
        updateHitbox() {
            this.hitbox.onGround = false;
            this.hitbox.yv -= 0.2;
            if (Math.abs(this.hitbox.xv) > Math.abs(this.hitbox.yv)) {
                this.solveAxis(this.hitbox.xv, 0, level);
                this.solveAxis(0, this.hitbox.yv, level);
            } else {
                this.solveAxis(0, this.hitbox.yv, level);
                this.solveAxis(this.hitbox.xv, 0, level);
            }

            //███████████ Tune physics and position body center. this code bro.
            this.hitbox.xv *= this.hitbox.onGround ? 0.92 : 0.98;
            this.hitbox.yv *= 0.99;
            this.nodes[0].x = this.hitbox.cx * 2;
            this.nodes[0].y = (this.hitbox.y + this.hitbox.hh * 0.5) * 2 + 2;
            this.nodes[1].x = this.hitbox.cx * 2 + this.hitbox.xv;
            this.nodes[1].y = (this.hitbox.y + this.hitbox.hh * 0.5) * 2 + 10;
        }
        //███████████ Main changes
        static updateFunctions = {
            normalMovement: {
                leg(thi, ind) {
                    let curNode = thi.nodes[ind];
                    curNode.r = thi.hitbox.hh - 1;
                    curNode.tx += thi.hitbox.xv * 0.7 * (1 - Math.abs(thi.hitbox.ptotalv - thi.hitbox.totalv) * 1.5);
                    curNode.c = {
                        x: thi.nodes[ind - 2].x,
                        y: thi.nodes[ind - 2].y
                    };

                    PhysUtils.parentRefVector(thi.nodes[ind - 1].desiredVector, thi.nodes[ind - 1], {
                        x: 0,
                        y: ind < 14 ? -1 : 1
                    });


                    PhysUtils.springPhys(
                        curNode,
                        curNode.tx,
                        curNode.ty - thi.hitbox.yv * 1,
                        0.01 + Math.abs(thi.hitbox.xv) * 0.015 + Math.abs(thi.hitbox.yv * 0.01),
                        0.85,
                    );

                },
            },
        };
        pickUpdateFunction(name, action) {

            return ArachnidBoss.updateFunctions[action][name];
        }
        //███████████ Mainish changes
        static initFunctions = {
            leg(thi, ind) {
                let curNode = thi.nodes[ind];
                curNode.tx = curNode.x;
                curNode.ty = curNode.y;
                curNode.offsetX = ind * 16 - 218;
                curNode.offsetY = -64;
                curNode.c = {
                    x: thi.nodes[ind - 2].x,
                    y: thi.nodes[ind - 2].y
                };
                curNode.r = Math.hypot(curNode.x - curNode.c.x, curNode.y - curNode.c.y) - 0.1;
            },
        };
        pickInitFunction(name) {
            return ArachnidBoss.initFunctions[name];
        }
        orientLimbs() {

            for (var i = 0; i < this.limbs.length; i++) {
                let limb = this.limbs[i];
                for (var j = 0; j < limb.nodes.length; j++) {
                    let node = this.nodes[limb.nodes[j]];

                    if (node.type == "root" && j > 1) {
                        PhysUtils.rotateFromReference(
                            point,
                            this.templateNodes[limb.nodes[1]],
                            this.nodes[limb.nodes[1]],
                            this.templateNodes[limb.nodes[0]],
                            this.nodes[limb.nodes[0]],
                            this.templateNodes[limb.nodes[j]],
                        );

                        node.x = point.x;
                        node.y = point.y;
                    }
                }
            }
        }
        updateNodes() {

            //PhysUtils.springPhys(body, tx, ty, strength, damping)

            this.hitbox.ptotalv = this.hitbox.totalv;
            this.hitbox.totalv = Math.hypot(this.hitbox.xv, this.hitbox.yv);

            //███████████ Find something better
            this.updateFeet([this.nodes[4], this.nodes[7], this.nodes[10], this.nodes[13], this.nodes[16], this.nodes[19], this.nodes[22], this.nodes[25]], 60 + Math.abs(this.hitbox.xv) * 14, );

            //███████████ Run tilt and fake hitbox
            this.hitbox.ht = 64 - Math.abs(this.hitbox.xv) * 2 + Math.min(this.hitbox.yv, 0) * 4;
            this.hitbox.hh -= (this.hitbox.hh - this.hitbox.ht) / 8.0;
            this.hitbox.hh = Math.max(this.hitbox.hh, 58);

            this.orientLimbs();

            //███████████ Change
            for (var i = 0; i < 8; i++) {
                this.pickUpdateFunction("leg", "normalMovement")(this, i * 3 + 4);
            }



            for (var i = 0; i < this.ends.length; i++) {
                let node = this.nodes[this.ends[i]];
                PhysUtils.solveEnds(node, node.c, node.r);
            }
            for (var i = 0; i < this.nodes.length; i++) {
                this.nodes[i].solve();
            }

        }
    }
    class Particle {
        constructor(x, y, z, xv, yv, type) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.xv = xv;
            this.yv = yv;
            this.type = type;

            Particle.particleInits[this.type](this);

        }
        update() {
            Particle.particleUpdates[this.type](this);
            glparticles.add(this.x, this.y, this.z, this.r, this.g, this.b, this.fade * this.fade);
            this.x += this.xv;
            this.y += this.yv;
        }
        static particleUpdates = {
            normalFire(thi) {
                thi.fade -= thi.fadeSpeed;
                thi.r /= 1.08;
                thi.g /= 1.04;
                thi.b /= 1.02;

                thi.yv += 0.01;
                thi.xv -= (thi.x - thi.ox) * 0.005
                thi.xv *= 0.9;
                thi.yv *= 0.97;
            }
        };
        static particleInits = {
            normalFire(thi) {
                thi.r = 4 * 2
                thi.g = 2.4 * 2
                thi.b = 1.4 * 2
                thi.fadeSpeed = 0.01;
                thi.fade = 1;
                thi.ox = thi.x;
                thi.xv -= (Math.random() - 0.5) * 0.8;
                thi.yv -= (Math.random() - 0.5) * 0.4;
            }
        };
    }
    class Camera {
        constructor(target = null) {
            this.x = 0;
            this.y = 0;
            this.z = 0;

            this.xv = 0;
            this.yv = 0;

            this.shx = 0;
            this.shy = 0;
            this.shstr=0;

            this.target = target;

            this.strength = 0.6;
            this.damping = 0.5;
        }

        follow(target) {
            this.target = target;
            return this;
        }
        update() {
            if (!this.target) return;
            PhysUtils.springPhys(
                this,
                this.target.cx,
                this.target.cy,
                this.strength,
                this.damping,
            );
            let plr=Player.entity.hitbox;
            if(plr.onGround&&Math.abs(plr.totalv-plr.ptotalv)>4){
                this.shstr+=Math.abs(plr.totalv-plr.ptotalv)*0.6;
            }
            this.shx+=(Math.random()-0.5)*this.shstr;
            this.shy+=(Math.random()-0.5)*this.shstr;
            this.shx/=1.1;
            this.shy/=1.1;
            this.shstr/=1.1;
       
            this.x = Math.smoothMax(Math.smoothMin(this.x, level.width * 32 - 160, 32), 160, 32)+this.shx;
            this.y = Math.smoothMax(Math.smoothMin(this.y, level.height * 32 - 90, 32), 90, 32)+this.shy;
        }
        snap() {
            if (!this.target) return; 
            this.x = this.target.cx;
            this.y = this.target.cy;
            this.xv = 0;
            this.yv = 0;
        }
    } 
    class EntityHandler { 
        constructor(maxSize = 15300) {
            this.entities = [];
            this.vertexBuffer = new Float32Array(maxSize);
            this.uvBuffer = new Float32Array(maxSize);

            this.vertexCount = 0;
            this.uvCount = 0;
        }
        add(entity) {
            this.entities.push(entity);
            return entity;
        }
        update() {
            for (const entity of this.entities) {
                entity.updateHitbox?.();
                entity.updateNodes?.();
                entity.constructVertexArray();
            }
        }
        debugDraw() {
            for (const entity of this.entities)
                entity.displayHitbox?.();
        }
        buildMesh(mesh) {

            let v = 0;
            let u = 0;

            for (const entity of this.entities) {

                this.vertexBuffer.set(entity.vertices, v);
                this.uvBuffer.set(entity.uvs, u);

                v += entity.vertices.length;
                u += entity.uvs.length;
            }

            this.vertexCount = v;
            this.uvCount = u;

            mesh.setAttribute("coordinates", this.vertexBuffer.subarray(0, v));

            mesh.setAttribute("uv", this.uvBuffer.subarray(0, u));
        }
    }

    let entityHandler = new EntityHandler();
    entityHandler.add(new Humanoid(64, 128, 1.001, "player"));
    for (var i = 0; i < 1; i++) {
        entityHandler.add(new ArachnidBoss(828, 64, 1.0018, "spider"));
    }


    let Player = {};
    Player.entity = entityHandler.entities[0];


    //(owner,node1,node2, x,y,w,h)
    Player.sword = new Weapon(Player.entity, 6, 4, 0, 1, 32, 64, "rustySword");
    entityHandler.add(Player.sword);
    let particles = [];

    const maxLights = 8;
    const lightUniformData = new Float32Array(maxLights * 3);

    const camera = new Camera(Player.entity.hitbox);

    var player = {
        x: 0,
        y: 0,
        z: 0.0,
        px: 1,
        py: 1,
        pz: 0
    };
    var frameCount = 0;
    var now;
    const frameTime = 1000 / 60;

    let nextFrame = performance.now();

    let then = performance.now();

    function draw(now) {
        if (now >= nextFrame) {
            let dt = now - then;
            then = now;


            nextFrame += frameTime;
            input.updatePre();
            camera.update();

            gl.useProgram(compPass.program.program);

            //gl.uniform1f(impactFrame,clickedDur<8?(clickedDur/7):0);

            gl.useProgram(mainProgram.program);
            gl.uniform3fv(camMat, [camera.x, camera.y, camera.z]);
            lightUniformData.fill(0);
            lightUniformData.set(level.zones.lights.subarray(0, lightUniformData.length));

            gl.uniform3fv(glLights, lightUniformData);
            gl.uniform1f(iTime, performance.now());

            for (var i = 0; i < 1; i++) {
                entityHandler.entities[i + 1].hitbox.xv = Math.sin(i + frameCount * 0.02)
            }
            if (input.up() && Player.entity.hitbox.onGround) {
                Player.entity.hitbox.yv = 4.4;
            }
          
                Player.entity.hitbox.xv += (Player.entity.hitbox.onGround ? 0.22 : 0.09)*input.ls.x;
         
            //console.log(input.ls)
            glparticles.clear(); 
      
            for (var i = 0; i < 3; i++) {
                let x = level.zones.lights[i * 3]
                let y = level.zones.lights[i * 3 + 1]
                let z = level.zones.lights[i * 3 + 2]
                particles.push(new Particle(x, y, z, 0, 0, "normalFire"));
            }
            for (var i = 0; i < particles.length; i++) {
                let part = particles[i];
                part.update();
                if (part.fade < 0) {
                    particles[i] = particles[particles.length - 1];
                    particles.length--;
                }
            }
            //entityHandler.debugDraw();

            entityHandler.update();
            entityHandler.buildMesh(entitiesMesh);


            sceneTarget.bind();

            mainProgram.use();
            atlas.setImage(room1Tilemap);
            atlasNormals.setImage(room1TilemapNormal);
            worldMesh.draw();
            atlas.setImage(entityAtlas.canvas);
            atlasNormals.setImage(entityAtlasNormal.canvas);

            entitiesMesh.draw();

            particleProgram.use();
            gl.uniform3fv(camMatp, [camera.x, camera.y, camera.z]);
            gl.depthMask(true);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            glparticles.draw(); 
            sceneTarget.unbind();

            bloomPass.render(sceneTarget, ping);
            bloomPass.render(ping, pong);
            if (!true) {
                bloomPass.render(ping, pong);
                bloomPass.render(pong, ping);
                bloomPass.render(ping, pong);
                bloomPass.render(pong, ping);
                bloomPass.render(ping, pong);
                bloomPass.render(pong, ping);
                bloomPass.render(ping, pong); 
                bloomPass.render(pong, ping);
                bloomPass.render(ping, pong);
                bloomPass.render(pong, ping);
            }
            //bloomPass.render(pong, ping); 
            compPass.render(sceneTarget, null, ping);
            ctx.fillStyle = "rgb(0,0,0)";
            ctx.fillRect(0, 0, 600, 600);

            ctx.drawImage(gfx.canvas, 0, 0, 640, 360);
            
            ctx.fillStyle = "rgb(200,200,200)";
            ctx.font = "10px Jersey 10";
            ctx.fillRect(318, 174, 2, 10);
            ctx.fillRect(314, 178, 10, 2);
            ctx.fillText(Math.ceil(1000 / dt), 10, 10);
         
            input.updatePost()
            frameCount++;
            if (now > nextFrame + frameTime) {
                nextFrame = now + frameTime;
            }
        }

        requestAnimationFrame(draw);
    }


    for (let i = window.requestAnimationFrame(function() {}); i > 0; i--)
        window.cancelAnimationFrame(i);
    draw();

    //<script>