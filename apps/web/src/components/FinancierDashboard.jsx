import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import StatsCard from '@/components/StatsCard.jsx';
import CourseCard from '@/components/CourseCard.jsx';
import { BookOpen, Award, Clock, TrendingUp, Loader2, CheckCircle, Star, AlertTriangle, PlayCircle, ArrowRight, BarChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Card } from '@/components/ui/card.jsx';

const FinancierDashboard = () => {
  const { currentUser } = useAuth();
  const [financierCourses, setFinancierCourses] = useState([]);
  const [featuredCourse, setFeaturedCourse] = useState(null);
  const [userProgress, setUserProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Fetch the specific Featured Course: 'Lease Accounting Standards (IFRS 16 & ASC 842)'
        try {
          const featured = await pb.collection('courses').getFirstListItem('title="Lease Accounting Standards (IFRS 16 & ASC 842)"', {
            $autoCancel: false,
          });
          setFeaturedCourse(featured);
        } catch (err) {
          console.log("Featured course 'Lease Accounting Standards' not found yet", err);
          // Fallback to another course if the specific one isn't found
          try {
             const fallbackFeatured = await pb.collection('courses').getFirstListItem('title="Risk Assessment in Equipment Leasing"', {
                $autoCancel: false,
             });
             setFeaturedCourse(fallbackFeatured);
          } catch (fallbackErr) {
             console.log("Fallback featured course not found either", fallbackErr);
          }
        }

        // 2. Fetch other Financier courses
        const coursesResult = await pb.collection('courses').getList(1, 50, {
          sort: '-created',
          $autoCancel: false,
        });
        
        // Filter for other relevant financier courses to display in the list
        const targetTitles = [
          "Risk Assessment in Equipment Leasing",
          "Advanced Lease Structuring",
          "Financial Analysis & Lease Valuation"
        ];
        
        // Exclude the featured course from the main list if it's already shown above
        const courses = coursesResult.items.filter(c => 
          targetTitles.includes(c.title) && c.id !== featuredCourse?.id
        );
        setFinancierCourses(courses);

        // 3. Fetch user progress
        const progress = await pb.collection('userProgress').getFullList({
          filter: `userId = "${currentUser.id}"`,
          expand: 'courseId',
          $autoCancel: false
        });
        setUserProgress(progress);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser.id, featuredCourse?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#4f7ba7]" />
          <p className="text-gray-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-sm">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const completedCourses = userProgress.filter(p => p.status === 'completed');
  const inProgressCourses = userProgress.filter(p => p.status === 'in_progress');
  const totalHours = completedCourses.reduce((acc, curr) => acc + (curr.expand?.courseId?.duration_hours || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-r from-[#1a2332] to-[#2c3b55] text-white pt-12 pb-24 px-4 shadow-lg">
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-blue-500/20 text-blue-100 hover:bg-blue-500/30 border-blue-500/50">
                Financier Dashboard
              </Badge>
              <Badge variant="outline" className="text-gray-300 border-gray-600">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              Welcome back, {currentUser.name || 'Financier'}
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl leading-relaxed">
              Track your advanced leasing portfolio, master new accounting standards, and elevate your financial analysis skills.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatsCard 
            title="Courses Completed" 
            value={completedCourses.length} 
            icon={BookOpen}
            className="bg-white text-[#1a2332] shadow-md hover:shadow-lg transition-shadow"
          />
          <StatsCard 
            title="In Progress" 
            value={inProgressCourses.length} 
            icon={TrendingUp}
            className="bg-white text-[#4f7ba7] shadow-md hover:shadow-lg transition-shadow"
          />
          <StatsCard 
            title="Certificates" 
            value={completedCourses.filter(c => c.certificateEarned).length} 
            icon={Award}
            className="bg-white text-amber-600 shadow-md hover:shadow-lg transition-shadow"
          />
          <StatsCard 
            title="Learning Hours" 
            value={totalHours} 
            icon={Clock}
            className="bg-gradient-to-br from-[#4f7ba7] to-[#2c3b55] text-white shadow-md hover:shadow-lg transition-shadow"
          />
        </div>

        {/* Featured Course Section */}
        {featuredCourse && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Star className="w-6 h-6 text-amber-600 fill-amber-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1a2332]">Featured Course</h2>
                <p className="text-gray-500 text-sm">Recommended for your role</p>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row hover:shadow-2xl transition-all duration-300"
            >
              {/* Image Section */}
              <div className="md:w-2/5 relative h-72 md:h-auto overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 md:bg-gradient-to-r md:from-transparent md:via-black/10 md:to-black/60" />
                <img 
                  src={featuredCourse.image_url || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800"} 
                  alt={featuredCourse.title}
                  className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none shadow-lg">
                    New Release
                  </Badge>
                  <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg">
                    Advanced
                  </Badge>
                </div>
              </div>
              
              {/* Content Section */}
              <div className="p-8 md:w-3/5 flex flex-col justify-center bg-gradient-to-br from-white to-gray-50">
                <div className="flex flex-wrap items-center gap-4 mb-4 text-sm font-medium">
                  <div className="flex items-center gap-1.5 text-[#4f7ba7] bg-blue-50 px-3 py-1 rounded-full">
                    <Clock className="w-4 h-4" />
                    {featuredCourse.duration_hours || 7} Hours
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    <BarChart className="w-4 h-4" />
                    Advanced Level
                  </div>
                  <div className="flex items-center gap-1.5 text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    <Award className="w-4 h-4" />
                    Certificate Included
                  </div>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold text-[#1a2332] mb-4 group-hover:text-[#4f7ba7] transition-colors">
                  {featuredCourse.title}
                </h3>
                
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  {featuredCourse.description || "Master international (IFRS 16) and US (ASC 842) lease accounting standards. Learn recognition, measurement, and disclosure requirements."}
                </p>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-auto">
                  <Link to={`/courses/${featuredCourse.id}`} className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto bg-[#4f7ba7] hover:bg-[#3d6288] text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all group-hover:translate-x-1">
                      Start Learning <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm border-2 border-white shadow-sm">
                      {(featuredCourse.instructor_name || "LA").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{featuredCourse.instructor_name || "Lease Accounting Expert"}</p>
                      <p className="text-xs text-gray-500">Instructor</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>
        )}

        {/* In Progress Section */}
        {inProgressCourses.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1a2332] flex items-center gap-2">
                <PlayCircle className="w-6 h-6 text-[#4f7ba7]" />
                Continue Learning
              </h2>
              <Link to="/courses" className="text-sm text-[#4f7ba7] hover:underline font-medium">
                View All Courses
              </Link>
            </div>
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

        {/* Advanced Financier Courses Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-[#1a2332] mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#4f7ba7]" />
            Advanced Financier Courses
          </h2>
          {financierCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {financierCourses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  course={course}
                  actionLabel="View Course"
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center bg-gray-50 border-dashed border-2 border-gray-200">
              <div className="flex flex-col items-center gap-2">
                <BookOpen className="w-10 h-10 text-gray-300" />
                <p className="text-gray-500 font-medium">No other financier courses available at the moment.</p>
                <p className="text-sm text-gray-400">Check back later for new content.</p>
              </div>
            </Card>
          )}
        </section>

        {/* Completed Section */}
        {completedCourses.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-[#1a2332] mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
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

export default FinancierDashboard;