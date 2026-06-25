import { Link, useLocation } from "react-router-dom";
import { Home, PlusCircle, Clock, Trophy, UserCircle } from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", icon: Home, label: "Início" },
  { to: "/historico", icon: Clock, label: "Histórico" },
  { to: "/lancamento", icon: PlusCircle, label: "Lançar", highlight: true },
  { to: "/ranking", icon: Trophy, label: "Ranking" },
  { to: "/perfil", icon: UserCircle, label: "Perfil" },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 z-50">
      <div className="flex items-end justify-around px-2 h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label, highlight }) => {
          const active = pathname === to;

          if (highlight) {
            return (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center gap-1 -mt-5 pb-1"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
                    active
                      ? "bg-violet-500 shadow-violet-500/40 scale-110"
                      : "bg-violet-600 shadow-violet-900/50 hover:bg-violet-500"
                  }`}
                >
                  <Icon
                    className="w-6 h-6 text-white"
                    strokeWidth={active ? 2.5 : 2}
                  />
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    active ? "text-violet-400" : "text-gray-500"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-12 ${
                active ? "text-violet-400" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
