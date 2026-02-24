import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // DEVELOPMENT: Accept any credentials and fake sign-in
    auth.setMockUser({
      id: email || "dev-user",
      email,
      full_name: fullName || "Dev User",
    });
    setLoading(false);
    navigate("/dashboard", { replace: true });
    // BYPASS: Do not call Supabase auth methods in development
    // if (isSignUp) {
    //   const { error } = await supabase.auth.signUp({
    //     email,
    //     password,
    //     options: {
    //       data: { full_name: fullName },
    //       emailRedirectTo: window.location.origin,
    //     },
    //   });
    //   if (error) {
    //     toast({ title: "Error", description: error.message, variant: "destructive" });
    //   } else {
    //     toast({ title: "Account created!", description: "You can now sign in." });
    //     setIsSignUp(false);
    //   }
    // } else {
    //   const { error } = await supabase.auth.signInWithPassword({ email, password });
    //   if (error) {
    //     toast({ title: "Error", description: error.message, variant: "destructive" });
    //   }
    // }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold gold-text">InvoiceFlow</h1>
          <p className="text-muted-foreground mt-2">Premium Event Management Suite</p>
        </div>

        <div className="glass-card rounded-2xl p-8 gold-glow">
          <h2 className="text-xl font-serif font-semibold text-foreground mb-6">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <Label htmlFor="fullName" className="text-muted-foreground">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-muted-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full gold-gradient text-primary-foreground font-semibold">
              {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline font-medium"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
