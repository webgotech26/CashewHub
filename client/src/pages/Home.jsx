import { useNavigate } from 'react-router-dom';
import '../styles/pages/home.css';

function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="home-title">Welcome, {user.name || 'Customer'}</h1>
        <button onClick={handleLogout} className="home-logout-btn">Logout</button>
      </header>
      <main className="home-main">
        <p className="home-text">
          This is the customer home page. You can browse products and place orders here.
        </p>
      </main>
    </div>
  );
}

export default Home;
