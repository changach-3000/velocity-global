
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCourseLessons } from '@/hooks/useCourseLessons';
import { useEnrollmentCheck } from '@/hooks/useEnrollmentCheck';
import pb from '@/lib/pocketbaseClient';
import { Loader2, ArrowLeft, Download, ChevronLeft, ChevronRight, FileText, Lock, AlertCircle, ShoppingCart, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import LessonNotFound from '@/components/LessonNotFound';
import LessonResourceCard from '@/components/LessonResourceCard';
import LessonProgressIndicator from '@/components/LessonProgressIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { logDataFlow } from '@/utils/DataFlowLogger';

// Helper function to decode HTML entities
const decodeHtmlEntities = (html) => {
	if (!html) return '';
	if (typeof document === 'undefined') return html;
	const txt = document.createElement("textarea");
	txt.innerHTML = html;
	return txt.value;
};

// Helper function to format lesson content
const formatLessonContent = (html) => {
	if (!html) return '';
	let content = decodeHtmlEntities(html);
	if (!content.includes('<') && !content.includes('>')) {
		content = content.split('\n').map(line => {
			line = line.trim();
			if (!line) return '';
			if (line.match(/^[A-Z\s]{4,}(?:\s|:)/)) return `<h2>${line.replace(':', '')}</h2>`;
			if (line.startsWith('•') || line.startsWith('- ') || line.match(/^\d+\./)) {
				if (line.match(/^\d+\./)) return `<li>${line.replace(/^\d+\.\s*/, '')}</li>`;
				return `<li>${line.replace(/^[•-]\s*/, '')}</li>`;
			}
			if (line.includes(':')) {
				const parts = line.split(':');
				if (parts[0].trim().match(/^[A-Z\s]+$/)) return `<p><strong>${parts[0].trim()}:</strong>${parts.slice(1).join(':')}</p>`;
			}
			return `<p>${line}</p>`;
		}).join('');
		content = content.replace(/<li>.*?<\/li>/gs, match => `<ul>${match}</ul>`).replace(/<\/ul>\s*<ul>/g, '');
	}
	return content;
};

const LessonDetailPage = () => {
	const { lesson_id } = useParams();
	const navigate = useNavigate();
	const { toast } = useToast();
	const { fetchLessonById, fetchLessonContent, fetchLessonResources, fetchCourseById, fetchLessonsByCourse } = useCourseLessons();
	const { currentUser, isAuthenticated } = useAuth();

	const [lesson, setLesson] = useState(null);
	const [course, setCourse] = useState(null);
	const [content, setContent] = useState(null);
	const [resources, setResources] = useState([]);
	const [courseLessons, setCourseLessons] = useState([]);
	const [dataLoading, setDataLoading] = useState(true);
	const [dataError, setDataError] = useState(null);
	const [trackingRecord, setTrackingRecord] = useState(null);
	const [isCompleting, setIsCompleting] = useState(false);

	// Use the enrollment check hook
	const { 
		isEnrolled, 
		loading: enrollmentLoading, 
		error: enrollmentError, 
		enrollmentData,
		checkEnrollment 
	} = useEnrollmentCheck(lesson?.course_id, currentUser);

	useEffect(() => {
		const loadData = async () => {
			if (!lesson_id) return;

			setDataLoading(true);
			setDataError(null);
			try {
				// 1. Fetch Lesson
				const lessonData = await fetchLessonById(lesson_id);
				setLesson(lessonData);
				logDataFlow('LessonDetailPage:LessonFetched', lessonData, { lessonId: lesson_id });

				// 2. Fetch Course & All Lessons
				if (lessonData.course_id) {
					const [courseData, allLessons] = await Promise.all([
						fetchCourseById(lessonData.course_id),
						fetchLessonsByCourse(lessonData.course_id)
					]);
					setCourse(courseData);
					setCourseLessons(allLessons);
				}

				// 3. Fetch Content & Resources
				try {
					const [contentData, resourcesData] = await Promise.all([
						fetchLessonContent(lesson_id),
						fetchLessonResources(lesson_id)
					]);
					setContent(contentData);
					setResources(resourcesData);
				} catch (e) {
					// Content fetch failed (likely permission or missing content)
				}

			} catch (err) {
				setDataError('Failed to load lesson content.');
			} finally {
				setDataLoading(false);
			}
		};

		loadData();
	}, [lesson_id, fetchLessonById, fetchLessonContent, fetchLessonResources, fetchCourseById, fetchLessonsByCourse]);

	// Auto-create lesson tracking record when lesson is loaded and user is enrolled
	useEffect(() => {
		const initLessonTracking = async () => {
			if (!isEnrolled || !enrollmentData || !lesson?.id || !currentUser?.id) {
				return;
			}

			try {
				// Check if record exists in lesson_tracking
				const existingRecords = await pb.collection('lesson_tracking').getList(1, 1, {
					filter: `user_id="${currentUser.id}" && lesson_id="${lesson.id}"`,
					$autoCancel: false
				});

				if (existingRecords.items.length > 0) {
					setTrackingRecord(existingRecords.items[0]);
					return;
				}

				// Create new record
				const trackingData = {
					user_id: currentUser.id,
					enrollment_id: enrollmentData.id,
					lesson_id: lesson.id,
					lesson_number: lesson.order || 1,
					started_at: new Date().toISOString(),
					completed: false
				};

				const newRecord = await pb.collection('lesson_tracking').create(trackingData, { $autoCancel: false });
				setTrackingRecord(newRecord);
				
				toast({
					title: "Lesson Started",
					description: "Your progress is being tracked.",
					variant: "default",
				});

			} catch (error) {
				// Error initializing tracking record
			}
		};

		initLessonTracking();
	}, [isEnrolled, enrollmentData, lesson, currentUser, toast]);

	const handleMarkComplete = async () => {
		if (!trackingRecord) return;
		
		setIsCompleting(true);
		try {
			const updatedRecord = await pb.collection('lesson_tracking').update(trackingRecord.id, {
				completed: true,
				completed_at: new Date().toISOString()
			}, { $autoCancel: false });
			
			setTrackingRecord(updatedRecord);
			toast({
				title: "Lesson Completed!",
				description: "Great job! Progress saved.",
				variant: "default",
				className: "bg-green-50 border-green-200 text-green-800"
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "Could not save progress. Please try again.",
				variant: "destructive"
			});
		} finally {
			setIsCompleting(false);
		}
	};

	const handleNavigation = (direction) => {
		if (!courseLessons.length) return;
		const currentIndex = courseLessons.findIndex(l => l.id === lesson_id);
		if (currentIndex === -1) return;
		let targetLessonId;
		if (direction === 'next' && currentIndex < courseLessons.length - 1) targetLessonId = courseLessons[currentIndex + 1].id;
		else if (direction === 'prev' && currentIndex > 0) targetLessonId = courseLessons[currentIndex - 1].id;
		if (targetLessonId) {
			navigate(`/lesson/${targetLessonId}`);
			window.scrollTo(0, 0);
		}
	};

	// Combined loading state
	if (dataLoading || (lesson?.course_id && enrollmentLoading)) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
					<p className="text-gray-600">Loading lesson content...</p>
				</div>
			</div>
		);
	}

	if (dataError || !lesson) {
		return <LessonNotFound title="Lesson Not Found" message="This lesson content is currently unavailable." />;
	}

	// Access Control UI
	if (!isEnrolled) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<Card className="max-w-md w-full text-center p-8 shadow-xl border-t-4 border-blue-600">
					<div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
						<Lock className="w-10 h-10 text-blue-600" />
					</div>
					
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						{isAuthenticated ? "Course Enrollment Required" : "Login Required"}
					</h2>
					
					<p className="text-gray-600 mb-8">
						{isAuthenticated 
							? `You need to purchase "${course?.title || 'this course'}" to access this lesson.`
							: "Please log in to access this lesson content."
						}
					</p>
					
					{enrollmentError && (
						<div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center gap-2 text-left">
							<AlertCircle className="w-4 h-4 flex-shrink-0" />
							<span>Error checking enrollment: {enrollmentError.message}</span>
						</div>
					)}

					<div className="space-y-3">
						{isAuthenticated ? (
							<Link to={`/checkout?courseId=${course?.id}`}>
								<Button className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg gap-2">
									<ShoppingCart className="w-5 h-5" />
									Buy Course
								</Button>
							</Link>
						) : (
							<Link to={`/login?redirect=/lesson/${lesson_id}`}>
								<Button className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg">
									Log In to Continue
								</Button>
							</Link>
						)}
						
						<div className="flex gap-2">
							<Link to={course ? `/course/${course.id}` : '/courses'} className="flex-1">
								<Button variant="outline" className="w-full">
									View Course
								</Button>
							</Link>
							{enrollmentError && (
								<Button variant="ghost" onClick={checkEnrollment}>
									Retry
								</Button>
							)}
						</div>
					</div>
				</Card>
			</div>
		);
	}

	const breadcrumbs = [
		{ label: 'Courses', path: '/courses-lessons' },
		{ label: course?.title || 'Course', path: course ? `/course/${course.id}` : null },
		{ label: lesson.title, path: null }
	];

	const currentIndex = courseLessons.findIndex(l => l.id === lesson_id);
	const hasNext = currentIndex < courseLessons.length - 1;
	const hasPrev = currentIndex > 0;

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8 pb-24">
			<div className="max-w-6xl mx-auto">
				<BreadcrumbNavigation breadcrumbs={breadcrumbs} />

				<div className="mb-8 flex items-center justify-between">
					<Link to={course ? `/course/${course.id}` : '/courses-lessons'}>
						<Button variant="ghost" className="gap-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all">
							<ArrowLeft className="w-4 h-4" />
							Back to Course
						</Button>
					</Link>

					<div className="flex items-center gap-4">
						{trackingRecord && (
							<Button 
								onClick={handleMarkComplete}
								disabled={trackingRecord.completed || isCompleting}
								className={`gap-2 ${trackingRecord.completed ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
							>
								{isCompleting ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : trackingRecord.completed ? (
									<CheckCircle className="w-4 h-4" />
								) : (
									<div className="w-4 h-4 rounded-full border-2 border-white/50" />
								)}
								{trackingRecord.completed ? 'Completed' : 'Mark Complete'}
							</Button>
						)}
						
						{enrollmentData && (
							<LessonProgressIndicator
								lessonId={lesson.id}
								className="bg-white px-4 py-2 rounded-full shadow-md border border-gray-200"
							/>
						)}
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2 space-y-6">
						<Card className="bg-white border-0 shadow-lg">
							<CardContent className="p-8">
								<h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">{lesson.title}</h1>
								{lesson.description && (
									<p className="text-gray-600 text-lg leading-relaxed border-l-4 border-blue-500 pl-4">{lesson.description}</p>
								)}
							</CardContent>
						</Card>

						{!content ? (
							<Card className="bg-white border-0 shadow-lg">
								<CardContent className="text-center py-16 text-gray-500">
									<FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
									<p className="text-lg font-medium">No content available for this lesson.</p>
								</CardContent>
							</Card>
						) : (
							<div className="space-y-6">
								{content.video_url && (
									<Card className="bg-white border-0 shadow-lg overflow-hidden">
										<div className="aspect-video bg-black">
											<iframe
												src={content.video_url.replace('watch?v=', 'embed/')}
												className="w-full h-full"
												title={lesson.title}
												allowFullScreen
												allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
											/>
										</div>
									</Card>
								)}

								{content.content_body && (
									<Card className="bg-white border-0 shadow-lg">
										<CardContent className="p-8 md:p-10">
											<div className="lesson-content-display">
												<style>{`
                          .lesson-content-display { color: #1f2937; line-height: 1.75; }
                          .lesson-content-display h1 { color: #111827 !important; font-size: 2rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 2px solid #e5e7eb; }
                          .lesson-content-display h2 { color: #111827 !important; font-size: 1.75rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; }
                          .lesson-content-display p { color: #374151 !important; margin-bottom: 1.25rem; }
                          .lesson-content-display ul, .lesson-content-display ol { color: #374151 !important; margin-bottom: 1.5rem; padding-left: 1.75rem; }
                          .lesson-content-display ul { list-style-type: disc; }
                          .lesson-content-display li { color: #374151 !important; margin-bottom: 0.5rem; }
                          .lesson-content-display strong { color: #111827 !important; font-weight: 700; }
                          .lesson-content-display a { color: #2563eb !important; text-decoration: underline; }
                        `}</style>
												<div dangerouslySetInnerHTML={{ __html: formatLessonContent(content.content_body) }} />
											</div>
										</CardContent>
									</Card>
								)}
							</div>
						)}
					</div>

					<div className="lg:col-span-1 space-y-6">
						{resources.length > 0 && (
							<Card className="bg-white border-0 shadow-lg">
								<CardHeader className="pb-4 border-b border-gray-100">
									<CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
										<Download className="w-5 h-5 text-blue-600" />
										Resources
									</CardTitle>
								</CardHeader>
								<CardContent className="pt-4 space-y-3">
									{resources.map((resource) => (
										<LessonResourceCard key={resource.id} resource={resource} />
									))}
								</CardContent>
							</Card>
						)}

						{courseLessons.length > 1 && (
							<Card className="bg-white border-0 shadow-lg text-black">
								<CardHeader className="pb-4">
									<CardTitle className="text-lg font-semibold text-gray-900">Lesson Navigation</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<Button
										onClick={() => handleNavigation('prev')}
										disabled={!hasPrev}
										variant="outline"
										className="w-full gap-2 justify-start text-gray-700 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										<ChevronLeft className="w-4 h-4" />
										<span className="flex-1 text-left">Previous Lesson</span>
									</Button>
									<div className="text-center py-2 text-sm text-gray-500">
										Lesson {currentIndex + 1} of {courseLessons.length}
									</div>
									<Button
										onClick={() => handleNavigation('next')}
										disabled={!hasNext}
										className="w-full gap-2 justify-start bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
									>
										<span className="flex-1 text-left">Next Lesson</span>
										<ChevronRight className="w-4 h-4" />
									</Button>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default LessonDetailPage;
