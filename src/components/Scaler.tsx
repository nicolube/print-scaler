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

    file?: Readonly<IDxf>;

    globalScale: number = 3;

    center: Vector = new Vector(0, 0);

    lines: Line[] = [];

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
                    vertices.push(new Vector(v.x, v.y));
                });
                this.lines.push(new Line(vertices))
            }
        });

        // Move lines to center
        const [offset, width, height] = this.getDimentsion();
        let lineOffset = new Vector(offset.x + width / 2, offset.y + height / 2);
        console.log(lineOffset);

        this.lines.forEach(l => l.move(-lineOffset.x, -lineOffset.y));
        this.state_.angle = 0;

    }

    getDimentsion = () => {
        let max = new Vector(Number.MIN_VALUE, Number.MIN_VALUE);
        let min = new Vector(Number.MAX_VALUE, Number.MAX_VALUE);
        this.lines.forEach(l => {
            l.vertices.forEach(v => {
                if (v.x > max.x)
                    max.x = v.x;
                else if (v.x < min.x)
                    min.x = v.x;
                if (v.y > max.y)
                    max.y = v.y;
                else if (v.y < min.y)
                    min.y = v.y;
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
        if (this.file) {
            let a = p5.TWO_PI / 360 / 100 * p5.deltaTime;
            this.state_.angle += a;
            this.state_.angle %= p5.TWO_PI;
            this.setState(this.state_);
            this.lines.forEach(l => l.rotate(a));
        }

        const [,width, height] = this.getDimentsion();
        p5.noFill();
        let sacaledBed = this.state_.bedSize.clone()
        let sacaledPintarea = this.state_.bedSize.clone().sub(this.state_.padding * 2)

        let scaledPartOutline = new Vector(width, height);

        if (sacaledPintarea.x / scaledPartOutline.x > sacaledPintarea.y / scaledPartOutline.y)
            this.state_.partScale = sacaledPintarea.y / scaledPartOutline.y;
        else
            this.state_.partScale = sacaledPintarea.x / scaledPartOutline.x;

        scaledPartOutline.mul(this.globalScale).mul(this.state_.partScale);
        this.drawRectCentered(p5, sacaledBed.mul(this.globalScale));
        this.drawRectCentered(p5, sacaledPintarea.mul(this.globalScale));
        this.drawRectCentered(p5, scaledPartOutline);


        this.lines.forEach(l => this.drawLine(p5, l.clone().scale(this.globalScale).scale(this.state_.partScale)));
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