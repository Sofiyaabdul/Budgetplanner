import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const SummaryCard = ({
  title,
  amount,
  icon: Icon,
  trend,
  color = '#0d9488',
  bg = '#f0fdfa',
  subtitle
}) => {
  return (
    <div className="stat-card" style={{ '--stat-color': color, '--stat-bg': bg }}>
      <div className="stat-top">
        <span className="stat-label">{title}</span>
        {Icon && (
          <div className="stat-icon">
            <Icon size={18} strokeWidth={2.2} />
          </div>
        )}
      </div>

      <div className="stat-value tabular-nums">{amount}</div>

      {(trend || subtitle) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {trend && (
            <div
              className={`stat-trend ${
                trend.isPositive ? 'positive' : trend.isNegative ? 'negative' : 'neutral'
              }`}
            >
              {trend.isPositive ? (
                <ArrowUpRight size={14} />
              ) : trend.isNegative ? (
                <ArrowDownRight size={14} />
              ) : (
                <Minus size={14} />
              )}
              <span>{trend.value}</span>
              {trend.label && (
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>
                  {trend.label}
                </span>
              )}
            </div>
          )}

          {subtitle && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
