import { IDxf, ILineEntity } from "dxf-parser";


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


export class Part {
    lines: Line[];

    constructor(lines: Line[]) {
        this.lines = lines;
    }

    static createFromDxf = (dxf?: IDxf) => {
        let lines: Line[] = [];
        dxf?.entities.forEach(e => {
            if (e.type === "LINE") {
                let vertices: Vector[] = [];
                (e as ILineEntity).vertices.forEach(v => {
                    vertices.push(new Vector(v.x, -v.y));
                });
                if (vertices.length > 1)
                    lines.push(new Line(vertices))
            }
        });
        return new Part(lines);
    }


    moveToCenter = () => {
        const [offset, width, height] = this.getDimentsion();
        this.move(-offset.x - width / 2, -offset.y - height / 2);
    }

    scale = (scale: number) => {
        this.lines.forEach(l => l.scale(scale));
        return this;
    }

    move = (x: number, y: number) => {
        this.lines.forEach(l => l.move(x, y));
        return this;
    }

    rotate = (radians: number) => {
        this.lines.forEach(l => l.rotate(radians));
        this.moveToCenter();
        return this;
    }

    getMaxScale = (maxSize: Vector) => {
        const [, width, height] = this.getDimentsion();
        if (maxSize.x / width > maxSize.y / height)
            return maxSize.y / height;
        else
            return maxSize.x / width;
    }

    getDimentsion = () => {
        let max = new Vector(-Number.MAX_VALUE, -Number.MAX_VALUE);
        let min = new Vector(Number.MAX_VALUE, Number.MAX_VALUE);
        this.lines.forEach(l => {
            l.vertices.forEach(v => {
                if (v.x > max.x) {
                    max.x = v.x;
                }
                else if (v.x < min.x) {
                    min.x = v.x;
                }
                if (v.y > max.y) {
                    max.y = v.y;
                }
                else if (v.y < min.y) {
                    min.y = v.y;
                } else {

                }
            });
        });

        let offset = min;
        let width = max.x - min.x;
        let height = max.y - min.y;
        return [offset, width, height] as const;
    }


    clone = (): Part => {
        let lines: Line[] = [];
        this.lines.forEach(l => lines.push(l.clone()));
        return new Part(lines);
    }
}