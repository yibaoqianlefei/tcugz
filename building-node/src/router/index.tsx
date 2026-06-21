import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import Learn from "../pages/Learn";
import Node from "../pages/Node";
import Tools from "../pages/Tools";

// ── Placeholder pages for menu routes ──
import Placeholder from "../pages/Placeholder";

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/learn", element: <Learn /> },
  { path: "/node/:nodeId", element: <Node /> },
  { path: "/tools", element: <Tools /> },

  // ── Menu-driven routes ──
  { path: "/curriculum", element: <Placeholder title="构造原理" /> },
  { path: "/library", element: <Placeholder title="节点库" /> },
  { path: "/curriculum/cases", element: <Placeholder title="案例应用" /> },
  { path: "/textbook/roof-membrane", element: <Placeholder title="自主学习" /> },
  { path: "/games", element: <Placeholder title="作业训练" /> },
]);
