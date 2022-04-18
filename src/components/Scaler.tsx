import React, { Component, FormEvent } from 'react'
import Sketch from 'react-p5'
import { Line, Vector } from '../utils/geometry'
import UploadPrompt from './uploadPrompt'
import P5 from "p5";
import { IDxf, ILineEntity } from 'dxf-parser';
import { Button, Form, FormControl, InputGroup, Ratio } from 'react-bootstrap';

type Props = {}

type State = {
    showUploadPromt: boolean;
    bedSize: Vector;
    padding: number;
    partScale: number;
    angle: number;
}

class Scaler extends Component<Props, State> {

    state_: State = {
        showUploadPromt: false,
        bedSize: new Vector(235, 300),
        padding: 5,
        partScale: 1,
        angle: 0
    };

    parent?: HTMLElement;
    p5?: P5;

    w: number = 0;
    h: number = 0;
    center: Vector = new Vector(0, 0);

    globalScale: number = 3;

    lines: Line[] = [];

    file?: Readonly<IDxf>;

    isRotating: boolean = false;
    maxAngle: number = 0;
    maxScale: number = 0;

    constructor(props: Props) {
        super(props);
        this.state = this.state_;
    }


    onDxf = (dxf?: IDxf) => {
        this.file = dxf;
        this.checkFile();

        // Load files
        this.lines = [];
        this.file?.entities.forEach(e => {
            if (e.type === "LINE") {
                let vertices: Vector[] = [];
                (e as ILineEntity).vertices.forEach(v => {
                    vertices.push(new Vector(v.x, -v.y));
                });
                if (vertices.length > 1)
                    this.lines.push(new Line(vertices))
            }
        });

        this.startCalc();
    }

    startCalc = () => {
        this.state_.angle = 0;
        this.maxAngle = 0;
        this.maxScale = 0;
        this.isRotating = true;
    }


    getDimentsion = (lines: Line[]) => {
        let max = new Vector(-Number.MAX_VALUE, -Number.MAX_VALUE);
        let min = new Vector(Number.MAX_VALUE, Number.MAX_VALUE);
        lines.forEach(l => {
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

    updateSize = () => {

        this.w = this.parent?.offsetWidth as number
        this.h = this.parent?.offsetHeight as number
        this.center.x = this.w / 2;
        this.center.y = this.h / 2;

        if (this.w / this.state_.bedSize.x > this.h / this.state_.bedSize.y)
            this.globalScale = this.h / this.state_.bedSize.y * 0.95;
        else
            this.globalScale = this.w / this.state_.bedSize.y;
        this.p5?.resizeCanvas(this.w, this.h);
    }

    checkFile = () => {
        this.state_.showUploadPromt = !this.file;
        this.setState(this.state_);
    }

    setup = (p5: P5, parent: Element) => {
        this.parent = parent as HTMLElement;
        this.p5 = p5;
        this.updateSize();
        p5.createCanvas(this.w, this.h).parent(parent);
        new ResizeObserver(() => {
            this.updateSize();
        }).observe(parent);
        this.checkFile();
    }

    drawLine = (p5: P5, line: Line) => {
        for (let i = 1; i < line.vertices.length; i++) {
            const v1 = line.vertices[i - 1];
            const v2 = line.vertices[i];
            p5.line(v1.x, v1.y, v2.x, v2.y);
        }
    }

    drawRectCentered = (p5: P5, vect: Vector) => {
        p5.rect(-vect.x / 2, -vect.y / 2, vect.x, vect.y);
    }

    draw = (p5: P5) => {
        p5.clear();
        p5.background(240);
        p5.translate(this.w / 2, this.h / 2)
        let lines: Line[] = [];
        this.lines.forEach(l => lines.push(l.clone()))
        if (this.isRotating) {
            let a = p5.TWO_PI / 360 / 100 * p5.deltaTime;
            this.state_.angle += a;
            if (this.state_.angle > p5.PI) {
                this.isRotating = false;
                this.state_.angle = this.maxAngle;
            }
        }
        lines.forEach(l => l.rotate(-this.state_.angle));

        const [offset, width, height] = this.getDimentsion(lines);
        lines.forEach(l => l.move(-offset.x - width / 2, -offset.y - height / 2))
        let sacaledBed = this.state_.bedSize.clone()
        let sacaledPintarea = this.state_.bedSize.clone().sub(this.state_.padding * 2)

        let scaledPartOutline = new Vector(width, height);

        if (sacaledPintarea.x / scaledPartOutline.x > sacaledPintarea.y / scaledPartOutline.y)
            this.state_.partScale = sacaledPintarea.y / scaledPartOutline.y;
        else
            this.state_.partScale = sacaledPintarea.x / scaledPartOutline.x;

        if (this.state_.partScale > this.maxScale) {
            this.maxAngle = this.state_.angle;
            this.maxScale = this.state_.partScale;
        }
        this.setState(this.state_);

        scaledPartOutline.mul(this.state_.partScale);

        scaledPartOutline.mul(this.globalScale);

        p5.fill(255);
        p5.stroke(255, 0, 0);
        p5.strokeWeight(3);
        this.drawRectCentered(p5, sacaledBed.mul(this.globalScale));
        p5.noFill();
        p5.stroke(0, 0, 255);
        this.drawRectCentered(p5, sacaledPintarea.mul(this.globalScale));
        p5.stroke(0);
        this.drawRectCentered(p5, scaledPartOutline);
        lines.forEach(l => this.drawLine(p5, l.scale(this.globalScale).scale(this.state_.partScale)));
    }

    handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        const target = event.target as typeof event.target & {
            x: { value: number };
            y: { value: number };
            padding: { value: number };
        };
        this.state_.bedSize.x = target.x.value;
        this.state_.bedSize.y = target.y.value;
        this.state_.padding = target.padding.value;
        this.updateSize();
        this.setState(this.state_);
        this.startCalc();
    }
    render() {

        return (
            <div>
                {this.state.showUploadPromt ? <UploadPrompt onDxfUploaded={this.onDxf} /> : null}
                <Ratio aspectRatio="4x3" className="border border-5 rounded rounded-3">
                    <Sketch setup={this.setup} draw={this.draw} className="w-100 h-100" />
                </Ratio>;
                <InputGroup>
                    <InputGroup.Text>Rotation:</InputGroup.Text>
                    <FormControl type='text' disabled={true} value={`${this.p5?.degrees(this.state.angle).toFixed(2)}°`} />
                    <InputGroup.Text>Scale:</InputGroup.Text>
                    <FormControl type='text' disabled={true} value={`${(this.state.partScale * 100).toFixed(2)}%`} />
                </InputGroup>
                <div className='mt-3' />
                <Form onSubmit={this.handleSubmit}>
                    <InputGroup>
                        <InputGroup.Text>Bed size:</InputGroup.Text>
                        <InputGroup.Text>width (mm):</InputGroup.Text>
                        <FormControl name='x' type='number' defaultValue={this.state.bedSize.x} />
                        <InputGroup.Text>length (mm):</InputGroup.Text>
                        <FormControl name='y' type='number' defaultValue={this.state.bedSize.y} />
                        <InputGroup.Text>workspace padding (mm):</InputGroup.Text>
                        <FormControl name='padding' type='number' defaultValue={this.state.padding} />
                        <Button type='submit'>Save</Button>
                    </InputGroup>
                </Form>
            </div>
        )
    }
}

export default Scaler