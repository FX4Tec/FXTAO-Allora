import TaoList from './pages/TaoList';
import TaoForm from './pages/TaoForm';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Heatmap from './pages/Heatmap';
import Approvals from './pages/Approvals';
import Inspection from './pages/Inspection';
import Reports from './pages/Reports';
import Manual from './pages/Manual';
import Login from './pages/Login';
import Users from './pages/Users';
import SaasAdmin from './pages/SaasAdmin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "TaoList": TaoList,
    "TaoForm": TaoForm,
    "Dashboard": Dashboard,
    "Settings": Settings,
    "Heatmap": Heatmap,
    "Approvals": Approvals,
    "Inspection": Inspection,
    "Reports": Reports,
    "Manual": Manual,
    "Login": Login,
    "Users": Users,
    "SaasAdmin": SaasAdmin,
}

export const pagesConfig = {
    mainPage: "TaoList",
    Pages: PAGES,
    Layout: __Layout,
};
