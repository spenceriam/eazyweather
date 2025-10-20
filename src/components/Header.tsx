import { Cloud } from "lucide-react";

interface HeaderProps {
  locationName: string;
}

export function Header({ locationName }: HeaderProps) {
  const navItems = [
    { id: "current", label: "Current" },
    { id: "hourly", label: "Hourly" },
    { id: "forecast", label: "7-Day" },
    { id: "monthly", label: "Monthly" },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-8 h-8 text-blue-500" strokeWidth={1.5} />
              <h1 className="text-2xl font-light text-gray-800">EazyWeather</h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-sm font-medium">{locationName}</span>
            </div>

            <nav className="flex gap-2 flex-wrap">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
