import { useState, useCallback } from 'react';
import { getAllInstitutions, getCoursesForInstitution } from '@/constants/institutions';

interface UseInstitutionAutocompleteReturn {
  institutionOptions: string[];
  courseOptions: string[];
  handleInstitutionChange: (institution: string) => void;
  handleCourseChange: (course: string) => void;
  institution: string;
  course: string;
}

export function useInstitutionAutocomplete(
  initialInstitution: string = '',
  initialCourse: string = ''
): UseInstitutionAutocompleteReturn {
  const [institution, setInstitution] = useState(initialInstitution);
  const [course, setCourse] = useState(initialCourse);
  const [institutionDirty, setInstitutionDirty] = useState(false);
  const [courseDirty, setCourseDirty] = useState(false);

  const effectiveInstitution = institutionDirty ? institution : initialInstitution;
  const effectiveCourse = courseDirty ? course : initialCourse;

  const institutionOptions = getAllInstitutions();
  const courseOptions = getCoursesForInstitution(effectiveInstitution);

  const handleInstitutionChange = useCallback((newInstitution: string) => {
    setInstitutionDirty(true);
    setCourseDirty(true);
    setInstitution(newInstitution);
    setCourse('');
  }, []);

  const handleCourseChange = useCallback((newCourse: string) => {
    setCourseDirty(true);
    setCourse(newCourse);
  }, []);

  return {
    institutionOptions,
    courseOptions,
    handleInstitutionChange,
    handleCourseChange,
    institution: effectiveInstitution,
    course: effectiveCourse,
  };
}