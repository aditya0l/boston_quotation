"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Quotations", href: "/quotations", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950 border-b border-zinc-800 px-4 flex items-center justify-between z-20">
        <div className="flex items-center">
          <img src="/logo.png" alt="Boston Fitness Logo" className="h-8 object-contain" />
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-zinc-400 hover:text-white">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-zinc-950 border-r border-zinc-850 transform transition-transform duration-200 ease-in-out flex flex-col
        ${isOpen ? "translate-x-0 mt-16 lg:mt-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-zinc-850 hidden lg:flex">
          <img src="/logo.png" alt="Boston Fitness Logo" className="h-9 object-contain" />
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all
                    ${isActive 
                      ? "bg-zinc-900 text-white border-l-4 border-primary pl-2" 
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}
                  `}
                >
                  <item.icon 
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActive ? "text-primary" : "text-zinc-500 group-hover:text-zinc-300"}`} 
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-850">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-zinc-400 rounded-lg hover:bg-zinc-900 hover:text-red-500 group transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-zinc-500 group-hover:text-red-500" />
            Logout
          </button>
        </div>
      </div>
      
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 z-0 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
