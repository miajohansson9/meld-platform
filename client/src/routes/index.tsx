import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import {
  Login,
  Registration,
  RequestPasswordReset,
  ResetPassword,
  VerifyEmail,
  ApiErrorWatcher,
  TwoFactorScreen,
} from '~/components/Auth';
import RegistrationWizard from '~/components/Auth/RegistrationWizard';
import { AuthContextProvider } from '~/hooks/AuthContext';
import RouteErrorBoundary from './RouteErrorBoundary';
import StartupLayout from './Layouts/Startup';
import LoginLayout from './Layouts/Login';
import DashboardLayout from './Dashboard/DashboardLayout';
import TodayPage from './Dashboard/TodayPage';
import LogPage from './Dashboard/LogPage';
import ChatsPage from './Dashboard/ChatsPage';
import FragmentsPage from './Dashboard/FragmentsPage';
import NorthStarPage from './Dashboard/NorthStarPage';
import WinsVaultPage from './Dashboard/WinsVaultPage';
import MentorFeedPage from './Dashboard/MentorFeedPage';
import MePage from './Dashboard/MePage';
import WelcomePage from './Welcome/WelcomePage';
import ShareRoute from './ShareRoute';
import ChatRoute from './ChatRoute';
import Search from './Search';
import Root from './Root';
import MentorInterestForm from '~/components/MentorInterest/MentorInterestForm';
import MentorInterview from './Layouts/MentorInterview';
import MentorInterviewStart from '~/components/MentorInterview/MentorInterviewStart';
import MentorInterviewQuestion from '~/components/MentorInterview/MentorInterviewQuestion';
import MentorInterviewComplete from '~/components/MentorInterview/MentorInterviewComplete';

// Simple WizardLayout for public routes
const SimpleWizardLayout = () => (
  <div className="min-h-screen bg-meld-canvas">
    {/* Header */}
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/assets/logo-b.svg" alt="MELD" className="h-8 w-auto" />
        </div>
      </div>
    </header>

    {/* Main Content */}
    <div className="pt-20 min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <Outlet />
      </div>
    </div>
  </div>
);

// Public Auth Layout - provides context but no automatic redirects
const PublicAuthLayout = () => (
  <AuthContextProvider authConfig={{ publicRoute: true }}>
    <Outlet />
    <ApiErrorWatcher />
  </AuthContextProvider>
);

// Private Auth Layout - provides context with authentication enforcement
const PrivateAuthLayout = () => (
  <AuthContextProvider>
    <Outlet />
    <ApiErrorWatcher />
  </AuthContextProvider>
);

export const router = createBrowserRouter([
  {
    path: 'share/:shareId',
    element: <ShareRoute />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/',
    element: <StartupLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: 'forgot-password',
        element: <RequestPasswordReset />,
      },
      {
        path: 'reset-password',
        element: <ResetPassword />,
      },
      {
        path: 'mentors/signup',
        element: <MentorInterestForm />,
      },
    ],
  },
  // Public routes with auth context but no redirects
  {
    element: <PublicAuthLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: 'register',
        element: <SimpleWizardLayout />,
        children: [
          {
            index: true,
            element: <RegistrationWizard />,
          },
        ],
      },
      {
        path: 'verify',
        element: <VerifyEmail />,
      },
      {
        path: 'welcome',
        element: <WelcomePage />,
      },
    ],
  },
  // SECURE mentor interview routes - access token required (REMOVED OLD ROUTES)
  {
    path: '/mentor-interview/:access_token',
    element: <MentorInterview />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: 'start',
        element: <MentorInterviewStart />,
      },
      {
        path: 'question/:step',
        element: <MentorInterviewQuestion />,
      },

    ],
  },
  {
    path: '/mentor-interview/:access_token/complete',
    element: <MentorInterviewComplete />,
    errorElement: <RouteErrorBoundary />,
  },
  // Private routes with full authentication
  {
    element: <PrivateAuthLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '/',
        element: <LoginLayout />,
        children: [
          {
            path: 'login',
            element: <Login />,
          },
          {
            path: 'login/2fa',
            element: <TwoFactorScreen />,
          },
        ],
      },
      {
        element: <DashboardLayout />,
        children: [
          {
            path: 'today',
            element: <TodayPage />,
          },
          {
            path: 'log',
            element: <LogPage />,
          },
          {
            path: 'chats',
            element: <ChatsPage />,
          },
          {
            path: 'fragments',
            element: <FragmentsPage />,
          },
          {
            path: 'mentor/feed',
            element: <MentorFeedPage />,
          },
          {
            path: 'library/north-star',
            element: <NorthStarPage />,
          },
          {
            path: 'library/wins-vault',
            element: <WinsVaultPage />,
          },
          {
            path: 'me',
            element: <MePage />,
          },
          {
            index: true,
            element: <Navigate to="/today" replace={true} />,
          },
        ],
      },
      {
        path: '/',
        element: <Root />,
        children: [
          {
            index: true,
            element: <Navigate to="/today" replace={true} />,
          },
        ],
      },
    ],
  },
]);
