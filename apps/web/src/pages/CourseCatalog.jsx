import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useCourseData } from '@/contexts/CourseDataContext';
import CourseCard from '@/components/CourseCard';
import { motion } from 'framer-motion';
import { Filter, Loader2, RefreshCw, AlertCircle, BarChart2, Palette, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CourseCatalog = () => {
  // Use deduplicated courses from context with robust error handling
  const { courses, loading, error, refreshCourses } = useCourseData();
  const [sortBy, setSortBy] = useState('title');
  const [filterInstructor, setFilterInstructor] = useState('all');

  // Get unique instructors for filter
  const instructors = ['all', ...new Set(courses.map((c) => c.instructor_name).filter(Boolean))];

  // Filter and sort courses
  const filteredCourses = courses
    .filter((course) => {
      if (filterInstructor === 'all') return true;
      return course.instructor_name === filterInstructor;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'duration') return (b.duration_hours || 0) - (a.duration_hours || 0);
      return (a.title || '').localeCompare(b.title || '');
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#3b82f6] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg font-semibold mb-2">Error loading courses</p>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={refreshCourses} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Course Catalog - Master the Art of Leasing</title>
        <meta name="description" content="Browse our comprehensive catalog of leasing courses taught by industry experts." />
      </Helmet>

      <div className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] py-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Course Catalog
          </motion.h1>
          <p className="text-xl text-blue-100">
            Explore {courses.length} expert-led courses to advance your career
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-12">
        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-[#1e3a8a]" />
            <h2 className="text-lg font-semibold text-[#1e3a8a]">Filter & Sort</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent text-gray-900"
              >
                <option value="title">Title (A-Z)</option>
                <option value="price-low">Price (Low to High)</option>
                <option value="price-high">Price (High to Low)</option>
                <option value="duration">Duration (Longest First)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructor
              </label>
              <select
                value={filterInstructor}
                onChange={(e) => setFilterInstructor(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent text-gray-900"
              >
                {instructors.map((instructor) => (
                  <option key={instructor} value={instructor}>
                    {instructor === 'all' ? 'All Instructors' : instructor}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-600 text-lg">No courses found matching your filters.</p>
            <Button variant="link" onClick={() => { setFilterInstructor('all'); setSortBy('title'); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CourseCard course={course} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CourseCatalog;