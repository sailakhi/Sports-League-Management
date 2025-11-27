import React, { useState } from "react";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import CoachDashboard from "./components/dashboards/CoachDashboard";
import PlayerDashboard from "./components/dashboards/PlayerDashboard";
import Navbar from "./components/layout/Navbar";
import MatchesPage from "./components/pages/MatchesPage";
import StandingsPage from "./components/pages/StandingsPage";
import TeamsPage from "./components/pages/TeamsPage";
import AuthProvider, { useAuth } from "./contexts/AuthContext";

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show login/register if no user
  if (!user) {
    return (
      <>
        {isLogin ? (
          <LoginForm
            onToggleMode={() => setIsLogin(false)}
            onLoginSuccess={() => setActiveTab("matches")} // Navigate to MatchesPage
          />
        ) : (
          <RegisterForm
            onToggleMode={() => setIsLogin(true)}
            onRegisterSuccess={() => setActiveTab("matches")} // Navigate to MatchesPage
          />
        )}
      </>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        if (user.role === "admin") return <AdminDashboard />;
        if (user.role === "coach") return <CoachDashboard />;
        if (user.role === "player") return <PlayerDashboard />;
        return <StandingsPage />;
      case "matches":
        return <MatchesPage />;
      case "standings":
        return <StandingsPage />;
      case "teams":
        return <TeamsPage />;
      case "leagues":
        return user.role === "admin" ? <AdminDashboard /> : <StandingsPage />;
      default:
        return <StandingsPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
