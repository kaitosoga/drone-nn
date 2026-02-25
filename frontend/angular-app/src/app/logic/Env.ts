import * as tf from '@tensorflow/tfjs';
import { AnyRecord } from 'dns';

export class Env {
    width: number;
    height: number;

    x = 0;
    y = 0;
    vx = 0;
    vy = 0;
    ax = 0;
    ay = 0;
    a = 0;
    va = 0;

    GRAVITY: number;
    THRUST_POWER: number;
    X_AXIS_SENS: number;
    Y_AXIS_SENS: number;
    ROTATION_SPEED: number;
    ROTATION_DRAG: number;
    MOVEMENT_DRAG: number;
    ACC_THROTLE: number;

    static chPSeries: number[][] = [];
    chPIndex = 0;
    score: number;

    chpX = 0;
    chpY = -550;
    prevDirection = [0, -550];

    constructor(w: number, h: number, mDrag=0.5, rDrag=0.7, rSpeed=1, tPower=3.5, gravity=2) {
        this.width = w;
        this.height = h;
        this.score = 0;

        this.GRAVITY = gravity;
        this.THRUST_POWER = tPower;
        this.X_AXIS_SENS = 50;
        this.Y_AXIS_SENS = 1;
        this.ROTATION_SPEED = rSpeed;
        this.ROTATION_DRAG = rDrag;
        this.MOVEMENT_DRAG = mDrag;
        this.ACC_THROTLE = 0.4;

        Env.chPSeries = [[this.chpX, this.chpY]];

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
        if ((Math.hypot(this.chpX - this.x, this.chpY - this.y) < 50 || this.chpX == 0) && Env.chPSeries.length <= this.chPIndex) {
            this.chPIndex += 1;
            this.score += 1;
            // Math.atan2(this.chpY - this.y, this.chpX - this.x);

            let u = Math.random() * 2 * Math.PI;
            /*let delta = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v); // found this online
            let direction0 = this.prevDirection[0] + 0.3 * delta;

            direction0 =  Math.atan2(Math.sin(direction0), Math.cos(direction0));
            this.chpX = Math.cos(direction0) * 550;
            this.chpY = Math.sin(direction0) * 550;*/

            this.chpX = this.x + this.prevDirection[0] + Math.cos(u) * 200;
            this.chpY = this.y + this.prevDirection[1] + Math.sin(u) * 200;

            this.prevDirection = [this.chpX - this.x, this.chpY - this.y]

            Env.chPSeries.push([this.chpX, this.chpY]);

        } else if ((Math.hypot(this.chpX - this.x, this.chpY - this.y) < 50)) {
            this.score += 1;
            let chpXY = Env.chPSeries[this.chPIndex];
            //console.log(Env.chPSeries)
            this.chpX = chpXY[0];
            this.chpY = chpXY[1];
            this.chPIndex += 1;
        }
    }

    step(action: any) {
        let thrustL = action[0];
        let thrustR = action[1];
        
        let torque = thrustL - thrustR;
        let thrust = this.THRUST_POWER * Math.cos(this.a * (Math.PI / 180)) * ((thrustL + thrustR) / 2);
        this.va -= this.ROTATION_SPEED * torque //+ Math.cos(this.a); // last term for stabilisation
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
        if (this.a > 180) {d = this.a - 360} else {d = this.a};
        let ang = Math.tanh(d);
        let angVel = this.va;

        let dist = Math.hypot(dx, dy)
        // let reached = false;

        // if (this.x < 0 || this.x > this.width || this.y < 0 || this.y > this.height) {out = true} else {out = false}

        let state = {
            "opt": optimalVector,
            "vel": velVector,
            "acc": accVector,
            "ang": ang,
            "ang_vel": angVel,
            // "reached": reached
        }

        return state;



    }



}