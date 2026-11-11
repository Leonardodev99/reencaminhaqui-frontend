import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reencaminhamentos from './pages/Reencaminhamentos';
import Mensagens from './pages/Mensagens';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/reencaminhamentos" element={<Reencaminhamentos />} />
        <Route path="/mensagens" element={<Mensagens />} />
      
      </Routes>
    </BrowserRouter>
  );
}

export default App;