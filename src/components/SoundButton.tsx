
import React from 'react';


import { Button, ButtonProps } from '@/components/ui/button';



import { useButtonClickSound } from '@/hooks/useButtonClickSound';



import { Loader2 } from 'lucide-react';




// ─── Types ────────────────────────────────────────────────────────────────────




export type SoundType = 'click' | 'hover' | 'success' | 'error';




export interface SoundButtonProps extends ButtonProps {


  
  
  
  /** Enable or disable all sounds. Default: true */


  
  enableSound?: boolean;


  
  /** Which sound to play on click. Default: 'click' */


  
  clickSound?: SoundType;


  
  /** Which sound to play on hover. Default: none */


  
  hoverSound?: SoundType;


  
  /** Volume level 0–1. Default: 1 */


  
  volume?: number;


  
  /** Enable haptic feedback on mobile (navigator.vibrate). Default: false */


  
  haptic?: boolean;


  
  /** Haptic vibration duration in ms. Default: 30 */


  
  hapticDuration?: number;


  
  /** Show loading spinner and disable sound while true */


  
  loading?: boolean;


  
  /** Accessible label shown during loading */


  
  loadingLabel?: string;
}




// ─── Component ────────────────────────────────────────────────────────────────





const SoundButton = React.forwardRef<HTMLButtonElement, SoundButtonProps>(
  (
    {
      onClick,
      onMouseEnter,
      enableSound = true,
      clickSound = 'click',
      hoverSound,
      volume = 1,
      haptic = false,
      hapticDuration = 30,
      loading = false,
      loadingLabel = 'Loading…',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const { playSound } = useButtonClickSound({ volume });


    

    // Haptic helper — safely no-ops on desktop
    const triggerHaptic = () => {
      if (haptic && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(hapticDuration);
      }
    };


    

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading) return; // guard: never fire while loading
      if (enableSound) playSound(clickSound);
      triggerHaptic();
      onClick?.(e);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!loading && enableSound && hoverSound) {
        playSound(hoverSound);
      }
      onMouseEnter?.(e);
    };


    

    const isDisabled = disabled || loading;



    

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        disabled={isDisabled}
        aria-busy={loading}
        aria-label={loading ? loadingLabel : props['aria-label']}
        {...props}



        
      >



        
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingLabel}
          </span>
        ) : (
          children
        )}
      </Button>
    );
  }



  
);





SoundButton.displayName = 'SoundButton';

export { SoundButton };

