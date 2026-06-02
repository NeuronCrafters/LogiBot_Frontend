import { ToastProvider } from "@/components/Toast/ToastProvider";
import AppRoutes from "./routes/routes";

function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}

export default App;
