import { Component, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { Canvas } from '@react-three/fiber';
import { Center, OrbitControls, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import styles from './ModelViewer.module.css';

interface ModelViewerProps {
  glbUrl: string;
  previewUrl: string;
  maxYawDeg: number;
}

class ModelErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

interface SceneProps {
  url: string;
  maxYawDeg: number;
  controlsRef: RefObject<OrbitControlsImpl | null>;
  onLoaded: () => void;
}

function Scene({ url, maxYawDeg, controlsRef, onLoaded }: SceneProps) {
  const { scene } = useGLTF(url);
  const maxYaw = THREE.MathUtils.degToRad(maxYawDeg);

  // 组件挂载即代表 GLB 已加载完成(useGLTF 触发 Suspense)
  useEffect(() => {
    onLoaded();
  }, [onLoaded]);

  return (
    <>
      <ambientLight intensity={0.75} />
      <hemisphereLight color="#ffffff" groundColor="#b0a89a" intensity={0.55} />
      <directionalLight position={[4, 6, 4]} intensity={1.6} />
      <directionalLight position={[-3, 2, -4]} intensity={0.5} />
      <Center>
        <primitive object={scene} />
      </Center>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0, 0.05, 0]}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.65}
        minAzimuthAngle={-maxYaw}
        maxAzimuthAngle={maxYaw}
      />
    </>
  );
}

export function ModelViewer({ glbUrl, previewUrl, maxYawDeg }: ModelViewerProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [loaded, setLoaded] = useState(false);

  const handleLoaded = useCallback(() => setLoaded(true), []);
  const handleReset = useCallback(() => controlsRef.current?.reset(), []);

  return (
    <div className={styles.viewer}>
      <div className={styles.canvasWrap} onDoubleClick={handleReset}>
        {previewUrl && !loaded && (
          <img className={styles.previewOverlay} src={previewUrl} alt="" />
        )}
        <ModelErrorBoundary
          fallback={<div className={styles.errorNote}>3D 模型加载失败,已显示静态预览</div>}
        >
          <Canvas
            camera={{ position: [0, 0.1, 3.6], fov: 40 }}
            gl={{ alpha: true, antialias: true }}
            dpr={[1, 2]}
          >
            <Suspense fallback={null}>
              <Scene
                url={glbUrl}
                maxYawDeg={maxYawDeg}
                controlsRef={controlsRef}
                onLoaded={handleLoaded}
              />
            </Suspense>
          </Canvas>
        </ModelErrorBoundary>
      </div>
      <div className={styles.toolbar}>
        <span className={styles.hint}>拖动旋转 · 滚轮缩放 · 双击回正 · 左右 {maxYawDeg}° 限制</span>
        <button type="button" className={styles.resetBtn} onClick={handleReset}>
          回正
        </button>
      </div>
    </div>
  );
}
