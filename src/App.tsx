import { Layout } from "@/components/Layout";
import { CustomerDetail } from "@/pages/CustomerDetail";
import { Customers } from "@/pages/Customers";
import { Engineers } from "@/pages/Engineers";
import { SalesReps } from "@/pages/SalesReps";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import { Dashboard } from "./pages/Dashboard";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sales-reps" element={<SalesReps />} />
          <Route path="/engineers" element={<Engineers />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
