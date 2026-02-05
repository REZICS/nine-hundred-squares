// src/router.tsx
import {Route, Switch} from 'wouter';
import {Suspense, lazy} from 'react';

// 页面懒加载（推荐做法，避免首屏过大）
const HomePage = lazy(() => import('./pages/HomePage.tsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.tsx'));
const UserPage = lazy(() => import('./pages/UserPage.tsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.tsx'));

// 一个简单的应用级布局
function MainLayout({children}: {children: React.ReactNode}) {
  return (
    <div style={{padding: 24}}>
      <header style={{marginBottom: 24}}>
        <h1>My App</h1>
      </header>
      <main>{children}</main>
    </div>
  );
}

// 路由出口组件
export function AppRouter() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MainLayout>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/about" component={AboutPage} />

          {/* 动态参数示例 */}
          <Route path="/user/:id">
            {params => <UserPage id={params.id} />}
          </Route>

          {/* 404 —— Switch 中最后一个无 path 的 Route 会兜底 */}
          <Route component={NotFoundPage} />
        </Switch>
      </MainLayout>
    </Suspense>
  );
}
