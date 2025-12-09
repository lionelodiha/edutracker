import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface SessionDetails {
  customerEmail: string;
  amountTotal: number;
  currency: string;
  paymentStatus: string;
  user?: any;
  token?: string;
}

export default function PaymentSuccess() {
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      navigate('/login');
      return;
    }

    const fetchSession = async () => {
      try {
        const response = await fetch(`http://localhost:5270/api/subscription/session/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setSessionDetails(data);
          
          // Auto-login if token is present
          if (data.token && data.user) {
              localStorage.setItem('edu_tracker_auth', JSON.stringify({
                  user: data.user,
                  token: data.token
              }));
              
              // Prepare for redirect
              setRedirecting(true);
              setTimeout(() => {
                  navigate(`/dashboard/${data.user.role}`);
              }, 3000);
          }
        }
      } catch (error) {
        console.error('Failed to fetch session details', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (!sessionDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Failed to load receipt details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for subscribing to EduTracker.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Receipt Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium text-gray-900">
                  {(sessionDetails.amountTotal / 100).toFixed(2)} {sessionDetails.currency.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600 capitalize">{sessionDetails.paymentStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{sessionDetails.customerEmail}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  A receipt has been sent to <strong>{sessionDetails.customerEmail}</strong>.
                </p>
                {redirecting && (
                  <p className="text-sm text-blue-700 mt-2 font-medium">
                    Redirecting to dashboard in 3 seconds...
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => sessionDetails.user ? navigate(`/dashboard/${sessionDetails.user.role}`) : navigate('/login')}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {sessionDetails.user ? 'Go to Dashboard' : 'Go to Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
