import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import StatsCard from '@/components/StatsCard.jsx';
import CourseCard from '@/components/CourseCard.jsx';
import { BookOpen, Award, Clock, TrendingUp, Loader2, Target, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const SalesPersonDashboard = () => {
  const { currentUser } = useAuth();
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  const RECOMMENDED_TITLES = [
    "Equipment Leasing Sales Fundamentals",
    "Customer Needs Analysis & Discovery",
    "Negotiation Strategies for Lease Deals",
    "Building Long-Term Client Relationships"
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allCourses = await pb.collection('courses').getFullList({
          sort: '-created',
          $autoCancel: false
        });
        
        const recommended = allCourses.filter(c => RECOMMENDED_TITLES.includes(c.title));
        setRecommendedCourses(recommended);

        const progress = await pb.collection('userProgress').getFullList({
          filter: `userId = "${currentUser.id}"`,
          expand: 'courseId',
          $autoCancel: false
        });
        setUserProgress(progress);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const completedCourses = userProgress.filter(p => p.status === 'completed');
  const inProgressCourses = userProgress.filter(p => p.status === 'in_progress');
  const totalHours = completedCourses.reduce((acc, curr) => acc + (curr.expand?.courseId?.duration_hours || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Header Section */}
      <div className="bg-emerald-900 text-white pt-12 pb-24 px-4">
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Hello, {currentUser.name || 'Sales Pro'}
            </h1>
            <p className="text-emerald-100 text-lg">
              Sharpen your sales skills and close more deals with our targeted curriculum.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatsCard 
            title="Courses Completed" 
            value={completedCourses.length} 
            icon={Target}
            className="bg-white text-emerald-900"
          />
          <StatsCard 
            title="In Progress" 
            value={inProgressCourses.length} 
            icon={TrendingUp}
            className="bg-white text-emerald-600"
          />
          <StatsCard 
            title="Certificates" 
            value={completedCourses.filter(c => c.certificateEarned).length} 
            icon={Award}
            className="bg-white text-amber-600"
          />
          <StatsCard 
            title="Learning Hours" 
            value={totalHours} 
            icon={Clock}
            className="bg-gradient-to-br from-emerald-800 to-emerald-600 text-white"
          />
        </div>

        {/* In Progress Section */}
        {inProgressCourses.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              Continue Learning
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inProgressCourses.map((progress) => (
                <CourseCard 
                  key={progress.id} 
                  progress={progress}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recommended Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Recommended for Sales Professionals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedCourses.map((course) => (
              <CourseCard 
                key={course.id} 
                course={course}
                actionLabel="Start Course"
              />
            ))}
          </div>
        </section>

        {/* Completed Section */}
        {completedCourses.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-emerald-600" />
              Completed Courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {completedCourses.map((progress) => (
                <CourseCard 
                  key={progress.id} 
                  progress={progress}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SalesPersonDashboard;