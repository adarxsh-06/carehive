import { NavLink, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";

const Navbar = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const { token, setToken, userData } = useContext(AppContext);
  const [showDropdown, setShowDropdown] = useState(false); // State for mobile dropdown visibility
  const paths = ["/", "/doctors", "/about", "/contact"];

  const logout = () => {
    setToken(false);
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400">
      {/* Logo */}
      <img
        onClick={() => navigate("/")}
        className="w-30 cursor-pointer"
        src={assets.logo}
        alt="Logo"
      />

      {/* Desktop Menu */}
      <ul className="hidden md:flex items-start gap-5 font-medium">
        {paths.map((path, index) => (
          <NavLink key={index} to={path}>
            <li className="py-1">
              {path === "/" ? "HOME" : path.replace("/", "").toUpperCase()}
            </li>
            <hr className="border-none outline-none h-0.5 bg-[#5f6FFF] w-3/5 m-auto hidden" />
          </NavLink>
        ))}
      </ul>

      {/* User Profile & Mobile Menu */}
      <div className="flex items-center gap-4">
        {token && userData ? (
          <div
            className="main flex items-center gap-2 cursor-pointer group relative"
            onClick={() => setShowDropdown(!showDropdown)} // Toggle dropdown on click for mobile
            onMouseEnter={() => setShowDropdown(true)} // Open dropdown on hover (for desktop)
            onMouseLeave={() => setShowDropdown(false)} // Close dropdown when mouse leaves
          >
            <img
              className="w-8 rounded-full"
              src={userData.image}
              alt="Profile"
            />
            <img
              className="w-2.5"
              src={assets.dropdown_icon}
              alt="Dropdown Icon"
            />

            {/* Dropdown Panel (Fix for Mobile & Hover for Desktop) */}
            {showDropdown && (
              <div className="sidepanel absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20">
                <div className="min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4">
                  <p
                    onClick={() => navigate("/my-profile")}
                    className="hover:text-black cursor-pointer"
                  >
                    My Profile
                  </p>
                  <p
                    onClick={() => navigate("/my-appointments")}
                    className="hover:text-black cursor-pointer"
                  >
                    My Appointments
                  </p>
                  <p
                    onClick={logout}
                    className="hover:text-black cursor-pointer"
                  >
                    Logout
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={() => navigate("/login")}
              className="bg-[#5f6FFF] text-white px-5 py-3 rounded-full font-light hidden md:block"
            >
              Create account
            </button>
            <button
              onClick={() => navigate("/admin-login")}
              className="bg-[#5f6FFF] text-white px-5 py-3 rounded-full font-light hidden md:block"
            >
              Admin/Doctor Login
            </button>
          </div>
        )}

        {/* Mobile Menu Icon */}
        <img
          onClick={() => setShowMenu(true)}
          className="w-6 md:hidden"
          src={assets.menu_icon}
          alt="Menu Icon"
        />

        {/* Mobile Menu */}
        <div
          className={`${
            showMenu ? "fixed w-full" : "h-0 w-0"
          } md:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}
        >
          <div className="flex items-center justify-between px-5 py-6">
            <img className="w-36" src={assets.logo} alt="Logo" />
            <img
              className="w-7"
              onClick={() => setShowMenu(false)}
              src={assets.cross_icon}
              alt="Close Icon"
            />
          </div>

          <ul className="flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium">
            {["/", "/doctors", "/about", "/contact"].map((path, index) => (
              <NavLink key={index} onClick={() => setShowMenu(false)} to={path}>
                <p className="px-4 py-2 rounded inline-block">
                  {path === "/" ? "Home" : path.replace("/", "").toUpperCase()}
                </p>
              </NavLink>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
