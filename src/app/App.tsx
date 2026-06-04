import { ToastProvider } from "@/app/providers/ToastProvider";
import AppRouter from "@/app/router/AppRouter";

function App() {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
}

export default App;
