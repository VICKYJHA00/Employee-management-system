import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useButtonClickSound } from '@/hooks/useButtonClickSound';

interface SoundButtonProps extends ButtonProps {
  enableSound?: boolean;
}

const SoundButton = React.forwardRef<HTMLButtonElement, SoundButtonProps>(
  ({ onClick, enableSound = true, children, ...props }, ref) => {
    const { playClickSound } = useButtonClickSound();
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (enableSound) {
        playClickSound();
      }
      onClick?.(e);
    };
    
    return (
      <Button ref={ref} onClick={handleClick} {...props}>
        {children}
      </Button>
    );
  }
);

SoundButton.displayName = 'SoundButton';

export { SoundButton };
