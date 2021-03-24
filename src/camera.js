// camera.js

import { mat4 } from 'gl-matrix'

export default class Camera {
    constructor() {
        this.position = [0,0,0]
        this.target = [0,0,0]
        this.up = [0,1,0]

        this.angle = Math.PI / 3.0
        this.aspect = 1.6
        this.znear = 1.0
        this.zfar = 1024.0

        this.view = mat4.create()
        this.proj = mat4.create()

        this.update()
    }
    update() {
        this.aspect = window.innerWidth / window.innerHeight;
        mat4.lookAt(this.view, this.position, this.target, this.up)
        mat4.perspective(this.proj, this.angle, this.aspect, this.znear, this.zfar)
    }
}