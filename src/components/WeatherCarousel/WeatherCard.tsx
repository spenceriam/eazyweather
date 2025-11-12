import { ReactNode } from 'react';

interface WeatherCardProps {
  title: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function WeatherCard({ title, children, onClick, className = '' }: WeatherCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-lg p-6 flex flex-col flex-shrink-0 h-full transition-all duration-150 ease-out active:shadow-xl active:-translate-y-1 ${className}`}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        {title}
      </h3>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
