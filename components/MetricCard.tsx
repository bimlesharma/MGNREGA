'use client';

import { motion } from 'framer-motion';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function MetricCard({ label, value, trend, trendValue, icon: Icon }: MetricCardProps) {
  const getTrendColor = () => {
    if (!trend) return '';
    return trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';
  };

  const TrendIcon = trend === 'up' ? ArrowTrendingUpIcon : trend === 'down' ? ArrowTrendingDownIcon : MinusIcon;

  return (
    <motion.div
      className="glass glass-hover rounded-xl p-6 card-shadow relative overflow-hidden"
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm text-slate-400 uppercase tracking-wider font-medium">{label}</p>
          {Icon && <Icon className="w-5 h-5 text-blue-400" />}
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <motion.p 
              className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              {value}
            </motion.p>
          </div>
          
          {trend && trendValue !== undefined && (
            <div className={`flex items-center gap-1 ${getTrendColor()}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-semibold">{Math.abs(trendValue).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
