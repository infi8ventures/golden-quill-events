import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  // Login is disabled - always redirect to dashboard
  // const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Always go to dashboard (login disabled)
    navigate("/dashboard", { replace: true });
    
    // Original login logic (commented out):
    // if (!loading) {
    //   navigate(user ? "/dashboard" : "/login", { replace: true });
    // }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-3xl font-serif font-bold gold-text">EventPro</h1>
        <p className="text-muted-foreground mt-2">Loading...</p>
      </div>
    </div>
  );
};

export default Index;
