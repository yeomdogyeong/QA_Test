import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  // 1. GitHub Pages 배포 경로 설정 (레포지토리 이름이 QA_Test인 경우)
  base: "/QA_Test/", 

  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      // 2. 경로 별칭을 프로젝트 루트나 src로 단순화
      '@': path.resolve(__dirname, './src'),
    },
  },

  // 3. 빌드 최적화 (정적 배포용)
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },

  // 4. AI Studio 전용 server/hmr 설정은 삭제 (기본값 사용)
});