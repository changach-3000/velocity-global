
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import apiServerClient from '@/lib/apiServerClient';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, ArrowRight, BookOpen, AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const urlCourseId = searchParams.get('courseId');
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const { clearCart } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Initializing payment verification...');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Validate Session ID existence immediately
    if (!sessionId) {
      console.error('[SuccessPage] No session_id found in URL');
      setError("Invalid Request: No payment session identifier found.");
      setLoading(false);
      return;
    }

    // Wait for auth to be ready
    if (isAuthenticated && currentUser) {
      verifyAndEnroll();
    } else if (isAuthenticated === false) {
      // Handle case where user might have lost session during redirect
      // In a real app, we might want to store session_id and redirect to login
      // For now, we'll show a loading state or prompt
      setLoading(false);
      setError("Please log in to complete your enrollment verification.");
    }
  }, [sessionId, isAuthenticated, currentUser]);

  const verifyAndEnroll = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[SuccessPage] Starting verification for session:', sessionId);

      // 2. Verify Session with Stripe via API
      setStatusMessage('Verifying payment status with secure gateway...');
      
      let sessionData;
      try {
        const response = await apiServerClient.fetch('/stripe/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to verify payment session');
        }
        
        sessionData = await response.json();
      } catch (apiErr) {
        console.error('[SuccessPage] API Verification Failed:', apiErr);
        throw new Error(`Payment verification failed: ${apiErr.message}`);
      }
      
      console.log('[SuccessPage] Stripe Session Status:', sessionData.payment_status);
      
      // 3. Validate Payment Status
      if (sessionData.payment_status !== 'paid') {
        console.warn('[SuccessPage] Payment not paid. Status:', sessionData.payment_status);
        // 6. Redirect to /cancel if payment was not successful
        navigate(`/cancel?session_id=${sessionId}`);
        return;
      }

      // 4. Determine courses to enroll
      let coursesToEnroll = [];
      
      // Priority 1: URL param (Single course checkout)
      if (urlCourseId) {
        coursesToEnroll.push(urlCourseId);
      } 
      // Priority 2: Metadata (Cart or fallback)
      else if (sessionData.metadata?.courseIds) {
        try {
          const ids = JSON.parse(sessionData.metadata.courseIds);
          coursesToEnroll = Array.isArray(ids) ? ids : [ids];
        } catch (e) {
          coursesToEnroll = [sessionData.metadata.courseIds];
        }
      } else if (sessionData.metadata?.courseId) {
        coursesToEnroll.push(sessionData.metadata.courseId);
      }

      if (coursesToEnroll.length === 0) {
        throw new Error('No course information found in payment record. Please contact support.');
      }

      setStatusMessage('Finalizing your enrollment...');
      const enrolledList = [];

      // 5. Create Enrollment Records in PocketBase
      for (const courseId of coursesToEnroll) {
        try {
          // Check if already enrolled to avoid duplicates
          try {
            await pb.collection('enrollment').getFirstListItem(
              `user_id="${currentUser.id}" && course_id="${courseId}"`,
              { $autoCancel: false }
            );
            console.log(`[SuccessPage] Already enrolled in ${courseId}`);
          } catch (e) {
            // Not enrolled, create record
            if (e.status === 404) {
              await pb.collection('enrollment').create({
                user_id: currentUser.id,
                course_id: courseId,
                enrollment_date: new Date().toISOString(),
                status: 'active',
                stripe_session_id: sessionId
              }, { $autoCancel: false });
              console.log(`[SuccessPage] Created enrollment for ${courseId}`);
            } else {
              throw e;
            }
          }

          // Fetch course details for display
          const course = await pb.collection('courses').getOne(courseId, { $autoCancel: false });
          enrolledList.push(course);
          
        } catch (err) {
          console.error(`[SuccessPage] Enrollment error for course ${courseId}:`, err);
          // We continue even if one fails, but log it
        }
      }

      if (enrolledList.length > 0) {
        setEnrolledCourses(enrolledList);
        clearCart(); // Clear cart only after successful enrollment
        setLoading(false);
      } else {
        throw new Error('Unable to complete enrollment record creation. Please contact support.');
      }

    } catch (err) {
      console.error('[SuccessPage] Critical Error:', err);
      setError(err.message || 'An unexpected error occurred during enrollment.');
      setLoading(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm max-w-md w-full">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{statusMessage}</h2>
          <p className="text-sm text-gray-500">Please do not close this window or refresh.</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center border-t-4 border-red-500">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Enrollment Verification Failed</h2>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          
          <div className="flex flex-col gap-3">
            <Button onClick={() => window.location.reload()} className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="w-4 h-4" />
              Retry Verification
            </Button>
            
            <div className="flex gap-3">
              <Link to="/contact-us" className="flex-1">
                <Button variant="outline" className="w-full">Contact Support</Button>
              </Link>
              <Link to="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full">Dashboard</Button>
              </Link>
            </div>
          </div>
          
          {sessionId && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-mono">Ref: {sessionId.slice(-8)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Success State
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Enrollment Successful - Master the Art of Leasing</title>
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-green-600 p-8 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">You're In!</h1>
            <p className="text-green-100 text-lg">
              Your enrollment has been confirmed successfully.
            </p>
          </div>

          <div className="p-8 sm:p-12">
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Ready to Start Learning
              </h3>
              <div className="space-y-3">
                {enrolledCourses.map(course => (
                  <motion.div 
                    key={course.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-blue-100 hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{course.title}</h4>
                      <p className="text-sm text-gray-500 line-clamp-1">{course.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 border-t border-gray-100">
              <Link to="/dashboard" className="flex-1">
                <Button className="w-full h-12 text-lg gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              
              <Link to="/courses" className="flex-1">
                <Button variant="outline" className="w-full h-12 text-lg gap-2 border-gray-300 hover:bg-gray-50">
                  <Home className="w-5 h-5" />
                  Browse More
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SuccessPage;
