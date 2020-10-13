/**
 * Implementation of instagram-like zoom + pan
 */
import React, {
  createRef,
  CSSProperties,
  ReactElement,
  useEffect,
  useState
} from 'react';

type ZoomableType = {
  children: ReactElement | ReactElement[],
  className?: string,
  zIndex?: number,
  style?: CSSProperties,
  maxScale?: number, // Same as CSS transform scale
  releaseAnimationTimeout?: number, // In milliseconds
  onReleaseAnimationStart?: (event: TouchEvent) => void,
  onReleaseAnimationEnd?: (event: TouchEvent) => void,
  onTouchStart?: (event: TouchEvent) => void,
  onTouchMove?: (event: TouchEvent) => void,
  onTouchEnd?: (event: TouchEvent) => void,
};

let releaseTimeout: any;

const Zoomable = (props: ZoomableType) => {
  const {
    children,
    onReleaseAnimationStart,
    onReleaseAnimationEnd,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    className,
  } = props;
  let {
    releaseAnimationTimeout,
    maxScale,
    zIndex,
    style,
  } = props;

  // Defaults
  releaseAnimationTimeout = releaseAnimationTimeout || 500;
  zIndex = zIndex || Number.MAX_SAFE_INTEGER;
  maxScale = maxScale || Number.MAX_SAFE_INTEGER;
  style = style || {};

  // Refs
  const elRef = createRef<HTMLDivElement>();

  // Distance between fingers
  const [initialDistance, setInitialDistance] = useState<number>(0);

  // Initial coordinates
  const [initialAbsolutePositionX, setInitialAbsolutePositionX] = useState<number>(0);
  const [initialAbsolutePositionY, setInitialAbsolutePositionY] = useState<number>(0);

  // Zoom
  const [zoom, setZoom] = useState<number>(0);

  // Transform translate
  const [moveLeft, setMoveLeft] = useState<number>(0);
  const [moveTop, setMoveTop] = useState<number>(0);

  // Transform origin
  const [anchorLeftPercentage, setAnchorLeftPercentage] = useState<number>(50);
  const [anchorTopPercentage, setAnchorTopPercentage] = useState<number>(50);

  // Is moving state
  const [isMoving, setMoving] = useState<boolean>(false);
  const [releaseAnimationDone, setReleaseAnimationDone] = useState<boolean>(true);

  // Gets touch related calculated data
  const getTouchData = (touchEvent: TouchEvent) => {
    // @ts-ignore
    const elBox = touchEvent?.target?.getBoundingClientRect();

    const touch1 = touchEvent?.touches?.[0];
    const touch2 = touchEvent?.touches?.[1];
    const { clientX: x1, clientY: y1 } = touch1 || {};
    const { clientX: x2, clientY: y2 } = touch2 || {};

    const distance = Math.round(
      Math.sqrt(
        ((x2 - x1) ** 2) + ((y2 - y1) ** 2)
      )
    );
    const relativePosition = {
      x: Math.round(((x1 - elBox.left) + (x2 - elBox.left)) / 2),
      y: Math.round(((y1 - elBox.top) + (y2 - elBox.top)) / 2),
    };
    const absolutePosition = {
      x: Math.round((x1 + x2) / 2),
      y: Math.round((y1 + y2) / 2),
    };
    const anchor = {
      left: Math.round((relativePosition.x / elBox.width) * 100),
      top: Math.round((relativePosition.y / elBox.height) * 100)
    };

    return {
      distance,
      absolutePosition,
      anchor,
    };
  };

  // Touch start handler
  const twoFingerTouchStart = (touchEvent: TouchEvent) => {
    touchEvent.preventDefault();
    const { distance, absolutePosition, anchor } = getTouchData(touchEvent);

    // Set initial distance
    setInitialDistance(distance);

    // Set initial absolute position xy
    setInitialAbsolutePositionX(absolutePosition?.x || 0);
    setInitialAbsolutePositionY(absolutePosition?.y || 0);

    // Set anchor
    setAnchorTopPercentage(anchor.top);
    setAnchorLeftPercentage(anchor.left);
  };

  // Touch move handler
  const twoFingerTouchMove = (touchEvent: TouchEvent) => {
    touchEvent.preventDefault();
    const { distance, absolutePosition } = getTouchData(touchEvent);

    // Calculate zoom
    const currentZoom = Math.max(0, distance - initialDistance);
    setZoom(currentZoom);

    // Calculate move x
    const currentMoveX = absolutePosition.x - initialAbsolutePositionX;
    setMoveLeft(currentMoveX);

    // Calculate move y
    const currentMoveY = absolutePosition.y - initialAbsolutePositionY;
    setMoveTop(currentMoveY);

    // Update initial, if zoom 0 (e.g. zooming out more than possible)
    if (currentZoom <= 0) {
      setInitialDistance(distance);
    }
  };

  // Touch stop handler - reset everything
  const twoFingerTouchStop = (event: TouchEvent) => {
    setMoving(false);
    setInitialDistance(0);
    setInitialAbsolutePositionX(0);
    setInitialAbsolutePositionY(0);
    setZoom(0);
    setMoveLeft(0);
    setMoveTop(0);
    setAnchorLeftPercentage(50);
    setAnchorTopPercentage(50);

    // Touch end callback
    if (typeof onTouchEnd === 'function') {
      onTouchEnd(event);
    }

    // Release animation start callback
    if (typeof onReleaseAnimationStart === 'function') {
      onReleaseAnimationStart(event);
    }

    // Release
    clearTimeout(releaseTimeout);
    releaseTimeout = setTimeout(() => {
      setReleaseAnimationDone(true);

      // Release animation end callback
      if (typeof onReleaseAnimationEnd === 'function') {
        onReleaseAnimationEnd(event);
      }
    }, releaseAnimationTimeout);
  };

  const touchStart = (touchEvent: TouchEvent) => {
    if (touchEvent?.touches?.length === 2) {
      setMoving(true);
      setReleaseAnimationDone(false);
      twoFingerTouchStart(touchEvent);

      // On touch start callback
      if (typeof onTouchStart === 'function') {
        onTouchStart(touchEvent);
      }
    }
  };

  const touchMove = (touchEvent: TouchEvent) => {
    if (touchEvent?.touches?.length === 2) {
      twoFingerTouchMove(touchEvent);

      // On touch move callback
      if (typeof onTouchMove === 'function') {
        onTouchMove(touchEvent);
      }
    }
  };

  const touchCancel = (event: TouchEvent) => {
    twoFingerTouchStop(event);
  };

  const touchEnd = (event: TouchEvent) => {
    twoFingerTouchStop(event);
  };

  useEffect(() => {
    const el = elRef?.current;

    /* eslint-disable no-unused-expressions */
    el?.addEventListener('touchstart', touchStart);
    el?.addEventListener('touchmove', touchMove);
    el?.addEventListener('touchcancel', touchCancel);
    el?.addEventListener('touchend', touchEnd);
    el?.addEventListener('mouseup', touchEnd);

    return () => {
      el?.removeEventListener('touchstart', touchStart);
      el?.removeEventListener('touchmove', touchMove);
      el?.removeEventListener('touchcancel', touchCancel);
      el?.removeEventListener('touchend', touchEnd);
      el?.removeEventListener('mouseup', touchEnd);
    };
    /* eslint-enable no-unused-expressions */
  }, [elRef]);

  const scale = Math.min(maxScale, 1 + (zoom / 100));

  return (
    <div ref={elRef}
         style={{
           position: (isMoving || !releaseAnimationDone) ? 'relative' : undefined, // Needed for z-index to work
           zIndex: (isMoving || !releaseAnimationDone) ? zIndex : undefined,
           transformOrigin: `${anchorLeftPercentage}% ${anchorTopPercentage}%`,
           transform: `translate(${moveLeft}px, ${moveTop}px) scale(${scale})`,
           transition: !isMoving
             ? `
             ${releaseAnimationTimeout}ms transform,
             ${releaseAnimationTimeout}ms transform-origin,
             ${releaseAnimationTimeout}ms z-index,
             ${releaseAnimationTimeout}ms position
             `
             : undefined,
           ...style
         }}
         className={className}
    >
      { children }
    </div>
  );
};

export default Zoomable;
