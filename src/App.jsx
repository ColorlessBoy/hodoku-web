import SudokuBoard from './components/SudokuBoard/SudokuBoard';
import { sampleSudoku } from './data/sampleSudoku';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <h1>Hodoku Web Canvas Renderer</h1>
      <div className="board-container">
        <SudokuBoard data={sampleSudoku} size={600} />
      </div>
      <p className="description">
        Rendering Demo: Givens (Black), User Values (Blue), Candidates (Small), 
        Cell Colors (Yellow Background), Candidate Colors (Red/Green), 
        Links (Red Strong, Green Dashed Weak).
      </p>
    </div>
  );
}

export default App;
