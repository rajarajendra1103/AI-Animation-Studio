import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MenuIcon } from './icons';

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const linkClass = "text-gray-500 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors";
    const activeLinkClass = "bg-blue-500 text-white px-3 py-2 rounded-md text-sm font-medium";

    return (
        <header className="bg-white shadow-md relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <button 
                            className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <MenuIcon className="h-6 w-6" />
                        </button>
                        <NavLink to="/" className="text-2xl font-bold text-gray-900 ml-4 tracking-wider">
                            AI Animation Studio
                        </NavLink>
                    </div>
                    <nav className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <NavLink to="/" className={({ isActive }) => isActive ? activeLinkClass : linkClass}>
                                Home
                            </NavLink>
                             <NavLink to="/templates" className={({ isActive }) => isActive ? activeLinkClass : linkClass}>
                                Templates
                            </NavLink>
                            <NavLink to="/projects" className={({ isActive }) => isActive ? activeLinkClass : linkClass}>
                                Projects
                            </NavLink>
                        </div>
                    </nav>
                </div>
            </div>
            {isMenuOpen && (
                <div className="md:hidden bg-white">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <NavLink to="/" className={({ isActive }) => `block ${isActive ? activeLinkClass : linkClass}`}>
                            Home
                        </NavLink>
                         <NavLink to="/templates" className={({ isActive }) => `block ${isActive ? activeLinkClass : linkClass}`}>
                            Templates
                        </NavLink>
                        <NavLink to="/projects" className={({ isActive }) => `block ${isActive ? activeLinkClass : linkClass}`}>
                            Projects
                        </NavLink>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;