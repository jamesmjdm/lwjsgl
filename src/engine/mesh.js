// mesh.js
import Buffer from 'engine/buffer'
import { vec2, vec3 } from 'gl-matrix'

export default class Mesh {
    static onLoad(mesh, source, norms) {
        let lines = source.split("\n")

        let pos = [], norm = [], tex = [], tri = []

        let loadMaterial = tokens => {}
        let setMaterial = tokens => {}

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i]
            let tokens = line.split(" ")
            switch (tokens[0]) {
                case "v":
                    pos.push([parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])]);
                    break;
                case "vn": 
                    norm.push([parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])]);
                    break;
                case "vt": 
                    tex.push([parseFloat(tokens[1]), parseFloat(tokens[2])]);
                    break;
                case "f":  
                    for (let j = 2; j < tokens.length-1; j++) {
                        tri.push(tokens[1], tokens[j], tokens[j+1]);
                    }
                    break;
                case "mtllib":
                    loadMaterial(tokens)
                    break;
                case "usemtl":
                    setMaterial(tokens)
                    break;
            }
        }

        // finds the index in arr of an array that shallow equals val[0..2]
        // arr is an array of arrays of length <= 3
        let indexof = (arr, val) => arr.findIndex(a => (a[0]===val[0] && a[1]===val[1] && a[2]===val[2]));

        let uniqueVerts = []
        mesh.begin()
        for (let i = 0; i < tri.length; i++) {
            var ids = tri.split("/")
            ids = [ parseInt(ids[0])-1, parseInt(ids[1])-1, parseInt(ids[2])-1 ]
            var k = indexof(uniqueVerts, ids)

            if (-1 === k) {
                uniqueVerts.push(ids)
                let p = (pos[ids[0]] || [0,0,0]).slice(0, 3)
                let n = (norm[ids[1]] || [0,1,0]).slice(0, 3)
                let t = (tex[ids[2]] || [0,0]).slice(0, 2)
                mesh.addVertex(p, n, t)
                mesh.addIndex(uniqueVerts.length-1)
            }
            else {
                mesh.addIndex(k)
            }
        }

        if (norms) {
            mesh.computeNormals()
        }
        mesh.end()
    }

    constructor(gl) {
        this.gl = gl
        this.material = {
            mode : gl.TRIANGLES,
            color : [1,1,1,1],
        }

        this.posBuf = null
        this.texBuf = null
        this.normBuf = null
        this.indexBuf = null

        this.begin()
        this.end()
    }

    load(obj, norms) {
        let mesh = this
        let client = new XMLHttpRequest()
        client.onload = () => Mesh.onLoad(mesh, client.responseText, norms);
        client.open("GET", obj)
        client.send()
    }
    begin() {
        this.positions = []
        this.normals = []
        this.texcoords = []
        this.indices = []
    }
    addVertex(pos, norm, tex) {
        this.positions = this.positions.concat(pos)
        this.normals = this.normals.concat(norm)
        this.texcoords = this.texcoords.concat(tex)
    }
    addIndex(i) {
        this.indices.push(i)
    }
    end() {
        this.posBuf = new Buffer(this.gl, new Float32Array(this.positions), false)
        this.normBuf = new Buffer(this.gl, new Float32Array(this.normals), false)
        this.texBuf = new Buffer(this.gl, new Float32Array(this.texcoords), false)
        this.indexBuf = new Buffer(this.gl, new Uint16Array(this.indices), true)
    }

    addQuad(pos, v1, v2, t, s) {
        let vcount = this.positions.length / 3
        let norm = vec3.create()

        vec3.cross(norm, v1, v2)
        norm = [norm[0], norm[1], norm[2]]

        let c2 = [ pos[0]+v1[0],        pos[1]+v1[1], pos[2]+v1[2]]
        let c3 = [ pos[0]+v2[0],        pos[1]+v2[1], pos[2]+v2[2]]
        let c4 = [ pos[0]+v1[0]+v2[0], pos[1]+v1[1]+v2[1], pos[2]+v1[2]+v2[2]]

        this.addVertex(pos, norm, [t[0], t[1]])
        this.addVertex(c2, norm, [t[0]+s[0], t[1]])
        this.addVertex(c3, norm, [t[0], t[1]+s[1]])
        this.addVertex(c4, norm, [t[0]+s[0], t[1]+s[1]])
        this.addIndex(vcount)
        this.addIndex(vcount+1)
        this.addIndex(vcount+2)
        this.addIndex(vcount+1)
        this.addIndex(vcount+3)
        this.addIndex(vcount+2)
    }

    addCube(min, max, tpos, tsize) {
        let xb = max[0] - min[0]
        let yb = max[1] - min[1]
        let zb = max[2] - min[2]

        let u0 = tpos[0]
        let u1 = tpos[0] + tsize[0]
        let v0 = tpos[1]
        let v1 = tpos[1] + tsize[1]

        this.addQuad([min[0], min[1], min[2]], [xb, 0, 0],  [0, 0, zb], [u0, v0], [tsize[0], tsize[1]]);
        this.addQuad([min[0], min[1], min[2]], [0, 0, zb],  [0, yb, 0], [u0, v1], [tsize[0], -tsize[1]]);
        this.addQuad([max[0], min[1], min[2]], [-xb, 0, 0], [0, yb, 0], [u0, v1], [tsize[0], -tsize[1]]);
        this.addQuad([min[0], max[1], min[2]], [0, 0, zb],  [xb, 0, 0], [u0, v1], [tsize[0], -tsize[1]]);
        this.addQuad([max[0], min[1], max[2]], [0, 0, -zb], [0, yb, 0], [u0, v1], [tsize[0], -tsize[1]]);
        this.addQuad([min[0], min[1], max[2]], [xb, 0, 0],  [0, yb, 0], [u0, v1], [tsize[0], -tsize[1]]);
    }

    addHeightGrid(imgData, w, h, heightScale) {
        heightScale /= 255.0

        let getPix = index => {
            let i = index*4, d = imgData.data
            return [d[i], d[i+1], d[i+2], d[i+3]]
        }
        let getR = index => (imgData.data[index*4])
        let getPix_xy = (x, y) => getPixel(y*imgData.width+x)
        let getR_xy = (x, y) => getR(y*imgData.width+x)

        let vcount = this.positions.length / 3
        let scale = 1

        for (let i = 0; i < w+1; i += 1) {
            for (let j = 0; j < h+1; j += 1) {
                this.addVertex([i, imgData.data[(i*length+j)*4]*heightScale, j], [0,0,0], [i/2, j/2])
            }
        }
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                this.addIndex(vcount +  i   *(h+1)+j)
                this.addIndex(vcount + (i+1)*(h+1)+j+1)
                this.addIndex(vcount + (i+1)*(h+1)+j)
                this.addIndex(vcount +  i   *(h+1)+j)
                this.addIndex(vcount +  i   *(h+1)+j+1)
                this.addIndex(vcount + (i+1)*(h+1)+j+1)
            }
        }
    }
    addSphere(center, rad, sectors, slices, tmin, tmax, f) {
        if (slices < 2 || sectors < 3) {
            return;
        }

        let vcount = this.positions.length / 3
        for (let v = 0; v < slices+1; v += 1) {
            let vn = (v / slices) * Math.PI
            let sinv = Math.sin(vn)
            let cosv = Math.cos(vn)

            for (let u = 0; u < sectors+1; u += 1) {
                var un = (u / sectors) * Math.PI * 2
                var cosu = Math.cos(un)
                var sinu = Math.sin(un)

                let p = [
                    rad * sinv * cosu,
                    rad * cosv,
                    rad * sinv * sinu
                    ]
                let n = [sinv * cosu, cosv, sinv * sinu]
                let t = [0,0]

                if (f) {
                    p = f(p, n, t)
                }

                this.addVertex(p, n, t)
            }
        }
        for (let i = 0; i < slices; i += 1) {
            for (let j = 0; j < sectors; j += 1) {
                let i1 = i
                let i2 = (i+1)
                let j1 = j % sectors
                let j2 = (j+1) % sectors
                let m = sectors+1
                this.addIndex(vcount + i1 * m + j1)
                this.addIndex(vcount + i2 * m + j2)
                this.addIndex(vcount + i2 * m + j1)
                this.addIndex(vcount + i1 * m + j1)
                this.addIndex(vcount + i1 * m + j2)
                this.addIndex(vcount + i2 * m + j2)
            }
        }
    }

    computeNormals() {
        var i0, i1, i2,
            p0, p1, p2,
            b1 = vec3.create(), b2 = vec3.create(), norm = vec3.create(),
            n0, n1, n2,
            normals = []

        for (let i = 0; i < this.positions.length/3; i += 1) {
            normals.push(vec3.create())
        }

        for (let i = 0; i < this.indices.length/3; i++) {
            i0 = this.indices[i*3]
            i1 = this.indices[i*3+1]
            i2 = this.indices[i*3+2]

            p0 = this.positions.slice(i0*3, i0*3+3)
            p1 = this.positions.slice(i1*3, i1*3+3)
            p2 = this.positions.slice(i2*3, i2*3+3)

            vec3.subtract(b2, p2, p1)
            vec3.subtract(b1, p0, p1)
            vec3.cross(norm, b2, b1)

            n0 = normals[i0]
            n1 = normals[i1]
            n2 = normals[i2]

            vec3.add(n0, n0, norm)
            vec3.add(n1, n1, norm)
            vec3.add(n2, n2, norm)
        }

        this.normals = []
        for (let i = 0; i < normals.length; i += 1) {
            vec3.normalize(normals[i], normals[i])
            this.normals.push(normals[i][0], normals[i][1], normals[i][2])
        }
    }
    draw(shader) {
        this.posBuf.bind(shader.posAttr, this.gl.FLOAT, 3)
        this.normBuf.bind(shader.normAttr, this.gl.FLOAT, 3)
        this.texBuf.bind(shader.texAttr, this.gl.FLOAT, 2)
        this.indexBuf.bindIndex()

        this.gl.drawElements(this.material.mode, this.indices.length, this.gl.UNSIGNED_SHORT, 0)
    }
}