import Home from "./pages/home/Home";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";
import Menu from "./components/menu/Menu";
import Tasks from "./pages/tasks/Tasks";
import Habits from "./pages/habits/Habits";
import Expenses from "./pages/expenses/Expenses";
import Exercise from "./pages/exercise/Exercise";
import Office from "./pages/office/Office";
import "./styles/global.scss";

function App() {
  const Layout = () => {
    return (
      <div className="main">
        <Navbar />
        <div className="container">
          <div className="menuContainer">
            <Menu />
          </div>
          <div className="contentContainer">
            <Outlet />
          </div>
        </div>
        <Footer />
      </div>
    );
  };

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        { path: "/", element: <Home /> },
        { path: "/tasks", element: <Tasks /> },
        { path: "/habits", element: <Habits /> },
        { path: "/expenses", element: <Expenses /> },
        { path: "/exercise", element: <Exercise /> },
        { path: "/office", element: <Office /> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
