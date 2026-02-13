
import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import { cn } from '@/lib/utils';

const LessonProgressIndicator = ({ lessonId, className }) => {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState('loading'); // 'loading', 'completed', 'in_progress', 'not_started'
  const [startedAt, setStartedAt] = useState(null);

  useEffect(() => {
    const loadProgress = async () => {
      if (!lessonId || !currentUser?.id) {
        setStatus('not_started');
        return;
      }
      
      try {
        // Query lesson_tracking directly
        const records = await pb.collection('lesson_tracking').getList(1, 1, {
          filter: `user_id = "${currentUser.id}" && lesson_id = "${lessonId}"`,
          $autoCancel: false
        });

        if (records.items.length > 0) {
          const record = records.items[0];
          setStartedAt(record.started_at);
          setStatus(record.completed ? 'completed' : 'in_progress');
        } else {
          setStatus('not_started');
        }
      } catch (error) {
        setStatus('error');
      }
    };

    loadProgress();
  }, [lessonId, currentUser?.id]);

  if (status === 'loading') {
    return <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />;
  }

  if (status === 'completed') {
    return (
      <div className={cn("flex items-center text-green-600 gap-1", className)} title="Completed">
        <CheckCircle className="w-5 h-5 fill-green-100" />
        <span className="text-xs font-medium hidden sm:inline">Completed</span>
      </div>
    );
  }

  if (status === 'in_progress') {
    return (
      <div className={cn("flex items-center text-blue-600 gap-1", className)} title={`Started: ${new Date(startedAt).toLocaleDateString()}`}>
        <Clock className="w-5 h-5" />
        <span className="text-xs font-medium hidden sm:inline">In Progress</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center text-gray-400 gap-1", className)} title="Not Started">
      <Circle className="w-5 h-5" />
      <span className="text-xs hidden sm:inline">Not Started</span>
    </div>
  );
};

export default LessonProgressIndicator;
