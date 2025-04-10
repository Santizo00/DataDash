import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="w-screen h-screen flex bg-white overflow-hidden"> 
      <Sidebar />

      <main className="flex-1 h-full w-full flex flex-col overflow-hidden">
        <div className="flex-1 w-full p-6 overflow-auto"> 
          <Outlet />
        </div>
      </main>
    </div>
  );
}