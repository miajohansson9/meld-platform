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
import { AuthContextProvider } from '~/hooks/AuthContext';
import RouteErrorBoundary from './RouteErrorBoundary';
import StartupLayout from './Layouts/Startup';
import LoginLayout from './Layouts/Login';
import dashboardRoutes from './Dashboard';
import ShareRoute from './ShareRoute';
import ChatRoute from './ChatRoute';
import Search from './Search';
import Root from './Root';
import MentorInterestForm from '~/components/MentorInterest/MentorInterestForm';
import MentorInterview from './Layouts/MentorInterview';
import MentorInterviewStart from '~/components/MentorInterview/MentorInterviewStart';
import MentorInterviewQuestion from '~/components/MentorInterview/MentorInterviewQuestion';
import MentorInterviewComplete from '~/components/MentorInterview/MentorInterviewComplete';


const AuthLayout = () => (
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
        path: 'register',
        element: <Registration />,
      },
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
  {
    path: 'verify',
    element: <VerifyEmail />,
    errorElement: <RouteErrorBoundary />,
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
  {
    element: <AuthLayout />,
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
      dashboardRoutes,
      {
        path: '/',
        element: <Root />,
        children: [
          {
            index: true,
            element: <Navigate to="/c/new" replace={true} />,
          },
          {
            path: 'c/:conversationId?',
            element: <ChatRoute />,
          },
          {
            path: 'search',
            element: <Search />,
          },
        ],
      },
    ],
  },
]);
