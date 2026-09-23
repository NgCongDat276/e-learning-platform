import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './routes/AppRoutes';
import { lmsThemeConfig } from './theme/themeConfig';
import { AuthProvider } from './context/AuthContext';

// Khởi tạo QueryClient cho toàn bộ ứng dụng
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Tránh tự gọi lại API khi chuyển tab
      retry: 1,                    // Thử lại 1 lần nếu mạng lỗi
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={lmsThemeConfig}>
        <AntdApp>
          <BrowserRouter>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
