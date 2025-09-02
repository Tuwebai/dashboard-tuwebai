import React from 'react';
import { motion } from 'framer-motion';
import { useLazyLoading } from '@/hooks/useLazyLoading';
import ProjectCard from './ProjectCard';

interface LazyProjectCardProps {
  project: any;
  user: any;
  projectCreators: any;
  onViewProject: (project: any) => void;
  onNavigateToCollaboration: (project: any) => void;
  onNavigateToEdit: (project: any) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (project: any) => void;
  onArchiveProject: (project: any) => void;
  onToggleFavorite: (project: any) => void;
  showAdminActions?: boolean;
  index?: number;
  isDragDisabled?: boolean;
  dragMode?: boolean;
}

export default function LazyProjectCard(props: LazyProjectCardProps) {
  const { elementRef, isVisible } = useLazyLoading<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '100px',
    triggerOnce: true
  });

  return (
    <div ref={elementRef}>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: (props.index || 0) * 0.1 }}
        >
          <ProjectCard {...props} />
        </motion.div>
      ) : (
        // Placeholder mientras se carga
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50 h-80 animate-pulse"
        >
          <div className="space-y-4">
            {/* Header placeholder */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
              <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
            </div>
            
            {/* Progress bar placeholder */}
            <div className="space-y-2">
              <div className="h-3 bg-slate-200 rounded-full"></div>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-slate-200 rounded-full"></div>
                ))}
              </div>
            </div>
            
            {/* Content placeholder */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-200 rounded-lg"></div>
                ))}
              </div>
            </div>
            
            {/* Footer placeholder */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
              </div>
              <div className="h-8 bg-slate-200 rounded w-20"></div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
