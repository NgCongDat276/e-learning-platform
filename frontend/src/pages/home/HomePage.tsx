import React, { useState, useEffect } from 'react';
import { HomeHeader } from './components/HomeHeader';
import { HeroSection } from './components/HeroSection';
import { MetricsRibbon } from './components/MetricsRibbon';
import { FeaturedCurricula } from './components/FeaturedCurricula';
import { MethodologySection } from './components/MethodologySection';
import { InteractiveDemoSection } from './components/InteractiveDemoSection';
import { TeachWithUsSection } from './components/TeachWithUsSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FaqSection } from './components/FaqSection';
import { HomeFooter } from './components/HomeFooter';
import { getCoursesListApi } from '../../api/course.api';
import type { Course } from '../../types/course.types';

export const HomePage: React.FC = () => {
  const [backendCourses, setBackendCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    getCoursesListApi({ limit: 50, status: 'published' })
      .then((res) => {
        if (isMounted && res.success && res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data as any).courses || [];
          setBackendCourses(list);
        }
      })
      .catch(() => {
        // Fallback safely to curated courses in FeaturedCurricula
      })
      .finally(() => {
        if (isMounted) setLoadingCourses(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalChapters = backendCourses.reduce((acc, c) => acc + (c._count?.chapters || 0), 0);

  return (
    <div
      style={{
        backgroundColor: 'var(--color-cream)',
        color: 'var(--color-ink)',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      <HomeHeader />
      <HeroSection />
      {/* <MetricsRibbon totalCourses={backendCourses.length} totalChapters={totalChapters} /> */}
      <FeaturedCurricula backendCourses={backendCourses} loading={loadingCourses} />
      <MethodologySection />
      <InteractiveDemoSection />
      <TeachWithUsSection />
      <TestimonialsSection />
      <FaqSection />
      <HomeFooter />
    </div>
  );
};
