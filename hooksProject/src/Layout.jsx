import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const routes = ['/dashboard', '/expense', '/budget', '/analytics'];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    const userId = localStorage.getItem('user_id');
    localStorage.removeItem('user_id');
    localStorage.removeItem(`user_${userId}`);
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('user_')) localStorage.removeItem(key);
    });
    navigate('/');
  };

  const goTo = (tab) => navigate(`/${tab.toLowerCase()}`);

  const handleNextPage = () => {
    const currentIndex = routes.indexOf(location.pathname);
    const nextIndex = (currentIndex + 1) % routes.length;
    navigate(routes[nextIndex]);
  };

  return (
    <div className="min-h-screen font-sans bg-white text-black">
      <nav className="flex justify-between items-center px-10 py-6 shadow-sm border-b">
        <div className="flex gap-10 text-sm font-semibold">
          {['Dashboard', 'Expense', 'Budget', 'Analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => goTo(tab)}
              className={`relative ${
                location.pathname.includes(tab.toLowerCase())
                  ? 'font-bold text-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              {tab}
              {location.pathname.includes(tab.toLowerCase()) && (
                <span className="block mx-auto mt-1 w-1 h-1 bg-blue-600 rounded-full"></span>
              )}
            </button>
          ))}
          <button
    onClick={handleLogout}
    className="border border-black px-4 py-1 rounded-full font-bold hover:bg-red-500 hover:text-white transition"
  >
    Logout
  </button>
        </div>
        <div className="flex gap-4 items-center">
        <button
  onClick={handleNextPage}
  className="w-10 h-10 border border-black rounded-full flex items-center justify-center transition-transform hover:rotate-45"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="black"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
  </svg>
</button>

        </div>
      </nav>

      <main className="px-10 py-6">
        <Outlet />
      </main>
    </div>
  );
}
