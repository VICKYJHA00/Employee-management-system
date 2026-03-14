import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useButtonClickSound } from '@/hooks/useButtonClickSound';

interface DashboardCardProps {
  title: string;
  description: string;
  iconSrc: string;
  onClick: () => void;
  badge?: string;
  isDisabled?: boolean;
  stats?: {
    label: string;
    value: string | number;
  }[];
  gradient?: string;
  glowColor?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  iconSrc,
  onClick,
  badge,
  isDisabled = false,
  stats = [],
}) => {
  const { playClickSound } = useButtonClickSound();
  
  const handleClick = () => {
    if (!isDisabled) {
      playClickSound();
      onClick();
    }
  };
  
  return (
    <Card 
      className={`
        relative overflow-hidden group
        bg-[rgba(0,0,0,0.6)]
        border border-[rgba(255,255,255,0.15)]
        transition-all duration-500 ease-out
        ${!isDisabled ? 'cursor-pointer hover:scale-[1.02] hover:border-secondary' : 'opacity-50 cursor-not-allowed'}
      `}
      style={{
        boxShadow: !isDisabled ? '0 0 30px rgba(124,58,237,0.3), 0 0 60px rgba(124,58,237,0.15)' : 'none',
      }}
      onClick={handleClick}
    >
      {/* Animated corner accent */}
      <div 
        className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary to-secondary rounded-full blur-3xl opacity-20 group-hover:opacity-40 group-hover:scale-150 transition-all duration-700 ease-out"
      />
      
      {/* Bottom glow effect */}
      <div 
        className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-primary to-secondary rounded-full blur-2xl opacity-10 group-hover:opacity-30 group-hover:scale-125 transition-all duration-700 ease-out"
      />

      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between mb-4">
          {/* Icon without container - full size */}
          <img 
            src={iconSrc} 
            alt={title} 
            className="h-16 w-16 object-contain transition-all duration-500 ease-out group-hover:scale-110"
          />
          {badge && (
            <Badge 
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground border-0 shadow-lg animate-pulse"
            >
              {badge}
            </Badge>
          )}
        </div>
        
        <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-accent transition-all duration-300">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">
          {description}
        </p>
        
        {stats.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center p-3 rounded-lg bg-[rgba(0,0,0,0.6)] backdrop-blur-sm border border-[rgba(255,255,255,0.15)] group-hover:border-secondary/30 transition-all duration-300"
              >
                <p className="text-xs text-text-muted mb-1">{stat.label}</p>
                <p className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}
        
        <Button
          disabled={isDisabled}
          onClick={(e) => {
            e.stopPropagation();
            playClickSound();
          }}
          className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-semibold border-0 shadow-lg transition-all duration-300 group-hover:shadow-xl"
          style={{
            boxShadow: '0 4px 15px rgba(124,58,237,0.3)',
          }}
        >
          Open Module
        </Button>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
