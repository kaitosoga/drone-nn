export class Env {
    width: number;
    height: number;
    chp_radius: number;

    chpX: number;
    chpY: number;

    x: number;
    y: number;
    vx: number;
    vy: number;
    ax: number;
    ay: number;
    a: number;
    va: number;

    GRAVITY: number;
    THRUST_POWER: number;
    X_AXIS_SENS: number;
    Y_AXIS_SENS: number;
    ROTATION_SPEED: number;
    ROTATION_DRAG: number;
    MOVEMENT_DRAG: number;
    ACC_THROTLE: number;


    constructor(w: number, h: number, r: number) {
        this.width = w;
        this.height = h;
        this.chp_radius = r;

        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.a = 0;
        this.va = 0;

        this.GRAVITY = 2
        this.THRUST_POWER = 3.5
        this.X_AXIS_SENS = 50
        this.Y_AXIS_SENS = 1
        this.ROTATION_SPEED = 1
        this.ROTATION_DRAG = 0.7
        this.MOVEMENT_DRAG = 0.5
        this.ACC_THROTLE = 0.4

        this.chpX = 0;
        this.chpY = 0;

        this.reset(this.width / 2, this.height / 2, 0, 0, 0, 0, 0, 0); 

    }

    reset(w: number, h: number, vx=0, vy=0, ax=0, ay=0, a=0, va=0) {
        this.width = w;
        this.height = h;
        this.vx = vx
        this.vy = vy;
        this.ax = ax;
        this.ay = ay;
        this.a = a;
        this.va = va;
    }

    spawnCheckpoints() {
        this.chpX = Math.random() * (0.8*this.width - 0.2*this.width) + 0.2*this.width;
        this.chpY = Math.random() * (0.8*this.height - 0.2*this.height) + 0.2*this.height;
    }

    step(action: any) {
        let thrustL = action[0];
        let thrustR = action[1];
        
        let torque = thrustL - thrustR;
        let thrust = this.THRUST_POWER * Math.cos(this.a * (Math.PI / 180)) * ((thrustL + thrustR) / 2);
        this.va -= this.ROTATION_SPEED * torque;
        this.va *= this.ROTATION_DRAG;

        this.a += this.va * this.ACC_THROTLE;
        this.a %= 360;

        this.vy += this.GRAVITY * this.ACC_THROTLE;
        this.vy -= this.Y_AXIS_SENS * thrust * this.ACC_THROTLE;

        let a_rad = this.a * (Math.PI / 180);
        this.vx = this.X_AXIS_SENS * Math.sin(a_rad);

        this.x += this.MOVEMENT_DRAG * this.vx;
        this.y += this.MOVEMENT_DRAG * this.vy;

        // state space:
        let dx = this.chpX - this.x;
        let dy = this.chpY - this.y;

        let optimalVector = [dx, dy];
        let velVector = [this.vx, this.vy];
        let accVector = [this.ax, this.ay];

        let d = null;
        if (this.a < 360) {d = this.a - 360} else {d = this.a};
        let ang = Math.tanh(d);
        let angVel = this.va;

        let dist = Math.hypot(dx, dy)
        let reached = false;
        let out = false;

        if (this.x < 0 || this.x > this.width || this.y < 0 || this.y > this.height) {out = true} else {out = false}

        let state = {
            "opt": optimalVector,
            "vel": velVector,
            "acc": accVector,
            "ang": ang,
            "ang_vel": angVel,
            "reached": reached,
            "out": out
        }

        return state;



    }



}