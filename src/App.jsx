import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reencaminhamentos from './pages/Reencaminhamentos';
import Mensagens from './pages/Mensagens';
import Perfil from './pages/Perfil';
import MinhasRedes from './pages/MinhasRedes';
import Rotas from './pages/Rotas';
import CriarConta from './pages/CriarConta';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/reencaminhamentos" element={<Reencaminhamentos />} />
        <Route path="/mensagens" element={<Mensagens />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/minhas-redes" element={<MinhasRedes />} />
        <Route path="/rotas" element={<Rotas />} />
        <Route path="/criar-conta" element={<CriarConta />} />
      
      </Routes>
    </BrowserRouter>
  );
}

export default App;