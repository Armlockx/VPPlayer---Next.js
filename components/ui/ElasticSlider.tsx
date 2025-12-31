'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface ElasticSliderProps {
  min?: number;
  max?: number;
  value: number;
  onChange?: (value: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  disabled?: boolean;
  className?: string;
  trackClassName?: string;
  thumbClassName?: string;
  showTooltip?: boolean;
}

export function ElasticSlider({
  min = 0,
  max = 100,
  value,
  onChange,
  onDragStart,
  onDragEnd,
  disabled = false,
  className = '',
  trackClassName = '',
  thumbClassName = '',
  showTooltip = true,
}: ElasticSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Spring animation for smooth value updates
  const spring = useSpring(localValue, {
    stiffness: 300,
    damping: 30,
    mass: 0.5,
  });

  // Transform spring value to percentage
  const percentage = useTransform(spring, (val) => {
    const clamped = Math.max(min, Math.min(max, val));
    return ((clamped - min) / (max - min)) * 100;
  });

  // Update local value when prop value changes (if not dragging)
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    onDragStart?.();
    updateValue(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || disabled) return;
    updateValue(e);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd?.();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    onDragStart?.();
    updateValue(e);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || disabled) return;
    updateValue(e);
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd?.();
    }
  };

  const updateValue = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newValue = min + percent * (max - min);
    
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={sliderRef}
      className={`elastic-slider ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '5px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Track */}
      <div
        className={`elastic-slider-track ${trackClassName}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '2.5px',
          overflow: 'hidden',
          transition: 'height 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.height = '10px';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.height = '5px';
        }}
      >
        {/* Progress Fill */}
        <motion.div
          className="elastic-slider-progress"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: percentage,
            background: 'red',
            borderRadius: '2.5px',
          }}
        />
      </div>

      {/* Thumb */}
      <motion.div
        ref={thumbRef}
        className={`elastic-slider-thumb ${thumbClassName}`}
        style={{
          position: 'absolute',
          top: '50%',
          x: percentage,
          width: '12px',
          height: '12px',
          background: 'white',
          borderRadius: '50%',
          cursor: disabled ? 'not-allowed' : 'grab',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          zIndex: 10,
          scale: isDragging ? 1.3 : 1,
        }}
        animate={{
          scale: isDragging ? 1.3 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
        whileHover={!disabled ? { scale: 1.2 } : {}}
        whileTap={!disabled ? { scale: 1.3 } : {}}
        drag="x"
        dragConstraints={sliderRef}
        dragElastic={0.1}
        onDrag={(e, info) => {
          if (!sliderRef.current) return;
          const rect = sliderRef.current.getBoundingClientRect();
          const percent = Math.max(0, Math.min(1, (info.point.x - rect.left) / rect.width));
          const newValue = min + percent * (max - min);
          setLocalValue(newValue);
          onChange?.(newValue);
        }}
        onDragStart={() => {
          if (!disabled) {
            setIsDragging(true);
            onDragStart?.();
          }
        }}
        onDragEnd={() => {
          setIsDragging(false);
          onDragEnd?.();
        }}
      >
        {/* Tooltip */}
        {showTooltip && isDragging && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: -25 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              marginBottom: '8px',
            }}
          >
            {formatTime(localValue)}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

