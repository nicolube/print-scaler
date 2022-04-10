import DxfParser, { IDxf } from 'dxf-parser';
import { ChangeEvent, useState } from 'react'
import { Button, Form, Modal, ProgressBar } from 'react-bootstrap';

type Props = {
    onDxfUploaded?: (dxf?: IDxf) => void;
}

const UploadPrompt = (props: Props) => {
    const [progress, setProgress] = useState(0)
    const [dxf, setDxf] = useState<IDxf | null>(null)

    const onFile = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files === null) return;
        let file: File = event.target.files[0];
        let decoder = new DxfParser();
        const reader = new FileReader();
        reader.addEventListener('progress', (event) => {
            if (event.loaded && event.total) {
                const percent = (event.loaded / event.total) * 100;
                setProgress(Math.round(percent))
            }
        });
        reader.addEventListener('load', (event) => {
            let fileContent = reader.result as string
            setDxf(decoder.parseSync(fileContent))
            setProgress(0);

        });
        reader.readAsText(file, "utf-8");
    };

    const onSubmit = () => {
        if (props.onDxfUploaded !== undefined) {
            props.onDxfUploaded(dxf ? dxf : undefined);
        }
    }

    return (
        <Modal.Dialog>
            <Modal.Header closeButton>
                <Modal.Title>Upload a DXF file</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {
                    progress !== 0 ? <ProgressBar now={progress} label={`${progress}%`} /> : null
                }
                <Form.Control type="file" id="myfile" accept=".dxf" name="myfile" hidden={progress !== 0} onChange={onFile} />


            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary">Close</Button>
                <Button variant="primary" onClick={onSubmit} disabled={dxf === null}>Save changes</Button>
            </Modal.Footer>
        </Modal.Dialog>
    )
}

export default UploadPrompt