

export class Vector {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        return this;
    }

    add = (x: number, y: number = x) => {
        this.x += x;
        this.y += y;
        return this;
    }

    sub = (x: number, y: number = x) => {
        this.x -= x;
        this.y -= y;
        return this;
    }

    mul = (x: number, y: number = x) => {
        this.x *= x;
        this.y *= y;
        return this;
    }

    div = (x: number, y: number = x) => {
        this.x /= x;
        this.y /= y;
        return this;
    }

    clone = (): Vector => {
        return new Vector(this.x, this.y);
    }
}

export class Line {

    vertices: Vector[] = [];

    constructor(vertices: Vector[]) {
        this.vertices = vertices;
    }

    scale = (scale: number) => {
        this.vertices.forEach(v => v.mul(scale));
        return this;
    }

    move = (x: number, y: number) => {
        this.vertices.forEach(v => v.add(x, y));
        return this;
    }

    rotate = (radians: number) => {
        this.vertices.forEach(v => {
            let newRadans = Math.atan2(v.x, v.y) + radians;
            let distance = Math.sqrt(v.x * v.x + v.y * v.y);
            v.x = Math.sin(newRadans) * distance;
            v.y = Math.cos(newRadans) * distance;
        });
        return this;
    }

    clone = (): Line => {
        let vertices: Vector[] = [];
        this.vertices.forEach(v => vertices.push(v.clone()));
        return new Line(vertices);
    }
}