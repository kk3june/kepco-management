import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CustomerDetail } from "@/pages/CustomerDetail";
import { Customers } from "@/pages/Customers";
import { Engineers } from "@/pages/Engineers";
import { Salesmans } from "@/pages/Salesmans";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./lib/auth";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route
                      path="/salesmans"
                      element={
                        <ProtectedRoute requiredRole="ADMIN">
                          <Salesmans />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/engineers"
                      element={
                        <ProtectedRoute requiredRole="ADMIN">
                          <Engineers />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/customers/:id" element={<CustomerDetail />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
