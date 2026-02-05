import {Box} from '@mui/material';
import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {animated, to, useSpring} from 'react-spring';
import {useGesture} from '@use-gesture/react';

type MonthGridProps = {
  filledCount: number;
  debug?: boolean;
};

const GRID_SIZE = 30;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

const GAP = 2;
const MIN_SCALE = 0.3;
const MAX_SCALE = 4;

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export default function MonthGrid({filledCount, debug = false}: MonthGridProps) {
  const clampedCount = Math.min(Math.max(filledCount, 0), TOTAL_CELLS);

  const containerRef = useRef<HTMLDivElement>(null);
  const containerSize = useRef({width: 0, height: 0});

  const [cellSize, setCellSize] = useState(16);

  useEffect(() => {
    const totalGap = GAP * (GRID_SIZE - 1);
    const nextCell = Math.max(
      2,
      Math.floor(
        (Math.min(containerSize.current.width, containerSize.current.height) -
          totalGap) /
          GRID_SIZE,
      ),
    );
    setCellSize(nextCell);
  }, [containerSize.current.width, containerSize.current.height]);

  // 画布（grid 未缩放前）的像素尺寸
  const baseGridPx = useMemo(() => {
    const gridPx = GRID_SIZE * cellSize + GAP * (GRID_SIZE - 1);
    return gridPx;
  }, [cellSize]);

  function clampXY(nextX: number, nextY: number, nextScale: number) {
    const {width: cw, height: ch} = containerSize.current;
    const scaled = baseGridPx * nextScale;

    // 内容比容器小 => 居中并锁定
    const minX = scaled > cw ? cw - scaled : (cw - scaled) / 2;
    const maxX = scaled > cw ? 0 : (cw - scaled) / 2;

    const minY = scaled > ch ? ch - scaled : (ch - scaled) / 2;
    const maxY = scaled > ch ? 0 : (ch - scaled) / 2;

    return {
      x: clamp(nextX, minX, maxX),
      y: clamp(nextY, minY, maxY),
    };
  }

  // 以容器内某个点（anchor）为缩放锚点，计算缩放后新的平移，使屏幕上的 anchor 对应内容位置不跳
  function zoomAboutPoint(
    currX: number,
    currY: number,
    currScale: number,
    nextScale: number,
    anchorX: number,
    anchorY: number,
  ) {
    // content-space 坐标：把屏幕点映射回内容坐标
    const contentX = (anchorX - currX) / currScale;
    const contentY = (anchorY - currY) / currScale;

    // 保持 anchor 对应的 contentX/Y 不变，解出新的 x/y
    const nextX = anchorX - contentX * nextScale;
    const nextY = anchorY - contentY * nextScale;
    return {x: nextX, y: nextY};
  }

  const [{x, y, scale}, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    config: {tension: 400, friction: 30},
  }));

  // 初次/resize 时把内容居中（如果内容更小），并且根据容器尺寸重新计算 cellSize
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;

      const width = rect.width;
      const height = rect.height;
      containerSize.current = {width, height};

      const nextCell = Math.max(
        4,
        Math.floor(Math.min(width, height) / GRID_SIZE),
      );
      setCellSize(nextCell);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // cellSize 变化后重新 clamp（并做一次居中）
  useLayoutEffect(() => {
    const currScale = scale.get();
    const centered = clampXY(x.get(), y.get(), currScale);
    api.start({x: centered.x, y: centered.y, immediate: true});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseGridPx]);

  const log = (...args: any[]) => {
    if (!debug) return;
    console.debug('[MonthGrid]', ...args);
  };

  const bind = useGesture(
    {
      onDrag: ({offset: [ox, oy], dragging}) => {
        const s = scale.get();
        const clamped = clampXY(ox, oy, s);
        api.start({x: clamped.x, y: clamped.y, immediate: dragging});
        console.debug('[MonthGrid] drag', {ox, oy, s, clamped});
      },

      onPinch: ({origin, offset: [d], event, pinching}) => {
        // 关键：确认这里能打印，证明 pinch 真进来了
        console.debug('[MonthGrid] pinch', {d, origin, type: event?.type});

        const el = containerRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const anchorX = origin[0] - rect.left;
        const anchorY = origin[1] - rect.top;

        const currScale = scale.get();
        const currX = x.get();
        const currY = y.get();

        const nextScale = clamp(1 + d / 200, MIN_SCALE, MAX_SCALE);
        const nextXY = zoomAboutPoint(
          currX,
          currY,
          currScale,
          nextScale,
          anchorX,
          anchorY,
        );
        const clampedXY = clampXY(nextXY.x, nextXY.y, nextScale);

        api.start({
          scale: nextScale,
          x: clampedXY.x,
          y: clampedXY.y,
          immediate: pinching,
        });
      },

      onWheel: ({event}) => {
        event.preventDefault();
        // 你已有的 wheel 逻辑保持即可，同时加 debug
        console.debug('[MonthGrid] wheel', {
          deltaY: event.deltaY,
          ctrlKey: (event as any).ctrlKey,
        });
        // ...
      },
    },
    {
      eventOptions: {passive: false},
      // 关键：在触摸设备上用 touch events 来驱动 pinch/drag
      pointer: {touch: true},
      // iOS Safari/滚动干扰的常用 workaround：preventScroll
      // 注意：这是 use-gesture 标注的“实验性”能力，但在 iOS 上确实更稳
      preventScroll: true,
      drag: {from: () => [x.get(), y.get()]},
    },
  );

  // HUD 调试信息
  const hud = debug ? (
    <Box
      sx={{
        position: 'absolute',
        left: 8,
        top: 8,
        zIndex: 10,
        px: 1,
        py: 0.5,
        borderRadius: 1,
        bgcolor: 'rgba(0,0,0,0.55)',
        color: 'white',
        fontSize: 12,
        lineHeight: 1.35,
        pointerEvents: 'none',
        whiteSpace: 'pre',
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      }}
    >
      {`cells: ${GRID_SIZE}x${GRID_SIZE}  filled: ${clampedCount}/${TOTAL_CELLS}
container: ${Math.round(containerSize.current.width)}x${Math.round(
        containerSize.current.height,
      )}
cellSize: ${cellSize}px  gap: ${GAP}px  baseGridPx: ${Math.round(baseGridPx)}px
x: ${x.get().toFixed(1)}  y: ${y.get().toFixed(1)}  scale: ${scale
        .get()
        .toFixed(3)}`}
    </Box>
  ) : null;

  return (
    <Box
      ref={containerRef}
      {...bind()}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {hud}

      <animated.div
        style={{
          transform: to(
            [x, y, scale],
            (tx, ty, s) => `translate3d(${tx}px, ${ty}px, 0) scale(${s})`,
          ),
          willChange: 'transform',
        }}
      >
        <Box
          role="grid"
          sx={{
            '--cell-size': `${cellSize}px`,
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, var(--cell-size))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, var(--cell-size))`,
            gap: `${GAP}px`,
          }}
        >
          {Array.from({length: TOTAL_CELLS}).map((_, index) => (
            <Box
              key={index}
              role="gridcell"
              sx={{
                width: 'var(--cell-size, 16px)',
                height: 'var(--cell-size, 16px)',
                borderRadius: '2px',
                backgroundColor:
                  index < clampedCount ? 'primary.main' : 'grey.300',
              }}
            />
          ))}
        </Box>
      </animated.div>
    </Box>
  );
}
