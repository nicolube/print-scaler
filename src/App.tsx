
import { Container } from 'react-bootstrap';
import './App.css';
import Scaler from './components/Scaler';

function App() {
  return (
    <div className="App h-100">
      <Container>
        <Scaler />
      </Container>
      <div className='m-5'/>
      <footer className="bg-light text-center text-lg-start w-100">
        <div className="text-center p-3">
          © 2022 Copyright: Nico Lube
          <br />
          <a className="text-dark" href="https://github.com/nicolube/print-scaler/"> github.com</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
