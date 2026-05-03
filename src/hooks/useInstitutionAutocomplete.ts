import { useState, useCallback, useMemo, useEffect } from "react";

import { api } from "@/lib/api";

interface UniversityItem {
  _id: string;
  name: string;
  acronym: string;
}

interface CourseItem {
  _id: string;
  name: string;
  universityId: string;
}

interface ApiLikeError {
  status?: number;
  message?: string;
}

interface UseInstitutionAutocompleteReturn {
  institutionOptions: string[];
  courseOptions: string[];
  handleInstitutionChange: (institution: string) => void;
  handleCourseChange: (course: string) => void;
  isInstitutionSelected: boolean;
  isCourseSelected: boolean;
  normalizeInstitutionInput: (rawInput: string) => string;
  matchesInstitutionOption: (option: string, input: string) => boolean;
  loadingUniversities: boolean;
  loadingCourses: boolean;
  loadError: string;
  institution: string;
  course: string;
  selectedUniversityId: string | null;
  selectedCourseId: string | null;
}

export function useInstitutionAutocomplete(
  initialInstitution: string = "",
  initialCourse: string = "",
): UseInstitutionAutocompleteReturn {
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [institution, setInstitution] = useState(initialInstitution);
  const [course, setCourse] = useState(initialCourse);
  const [institutionDirty, setInstitutionDirty] = useState(false);
  const [courseDirty, setCourseDirty] = useState(false);

  const effectiveInstitution = institutionDirty ? institution : initialInstitution;
  const effectiveCourse = courseDirty ? course : initialCourse;

  useEffect(() => {
    let cancelled = false;

    const loadUniversities = async () => {
      setLoadingUniversities(true);
      setLoadError("");

      try {
        const response = await api.get<UniversityItem[]>("/university");
        if (cancelled) return;

        const sorted = [...response].sort((a, b) =>
          a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
        );
        setUniversities(sorted);
      } catch (error) {
        if (!cancelled) {
          setUniversities([]);
          const apiError = error as ApiLikeError;
          if (apiError?.status === 403) {
            setLoadError("Seu perfil atual nao tem permissao para listar instituicoes.");
          } else {
            setLoadError("Nao foi possivel carregar as instituicoes no momento.");
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingUniversities(false);
        }
      }
    };

    void loadUniversities();

    return () => {
      cancelled = true;
    };
  }, []);

  const universitiesByName = useMemo(() => {
    return new Map(
      universities.map((item) => [item.name.trim().toLowerCase(), item] as const),
    );
  }, [universities]);

  const normalizedInstitutionInput = effectiveInstitution.trim().toLowerCase();

  const selectedUniversity = useMemo(() => {
    if (!normalizedInstitutionInput) return null;

    return (
      universities.find((item) => {
        const normalizedName = item.name.trim().toLowerCase();
        const normalizedAcronym = item.acronym.trim().toLowerCase();
        return (
          normalizedName === normalizedInstitutionInput ||
          normalizedAcronym === normalizedInstitutionInput
        );
      }) ?? null
    );
  }, [normalizedInstitutionInput, universities]);


  useEffect(() => {
    let cancelled = false;

    const loadCourses = async () => {
      if (!selectedUniversity?._id) {
        setCourses([]);
        return;
      }

      setLoadingCourses(true);

      try {
        const response = await api.get<CourseItem[]>(
          `/course/by-university/${selectedUniversity._id}`,
        );
        if (cancelled) return;

        const sorted = [...response].sort((a, b) =>
          a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
        );
        setCourses(sorted);
      } catch (error) {
        if (!cancelled) {
          setCourses([]);
          const apiError = error as ApiLikeError;
          if (apiError?.status === 403) {
            setLoadError("Seu perfil atual nao tem permissao para listar cursos.");
          } else {
            setLoadError("Nao foi possivel carregar os cursos da instituicao selecionada.");
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingCourses(false);
        }
      }
    };

    void loadCourses();

    return () => {
      cancelled = true;
    };
  }, [selectedUniversity?._id]);

  const institutionOptions = useMemo(
    () => universities.map((item) => item.name),
    [universities],
  );

  const courseOptions = useMemo(
    () => courses.map((item) => item.name),
    [courses],
  );

  const isInstitutionSelected = Boolean(selectedUniversity);

  const normalizedCourseInput = effectiveCourse.trim().toLowerCase();
  const selectedCourse = useMemo(() => {
    if (!normalizedCourseInput) return null;
    return courses.find((c) => c.name.trim().toLowerCase() === normalizedCourseInput) ?? null;
  }, [normalizedCourseInput, courses]);
  const isCourseSelected =
    normalizedCourseInput.length > 0 &&
    courseOptions.some((option) => option.trim().toLowerCase() === normalizedCourseInput);

  const normalizeInstitutionInput = useCallback(
    (rawInput: string) => {
      const normalized = rawInput.trim().toLowerCase();
      if (!normalized) return rawInput;

      const exactByName = universitiesByName.get(normalized);
      if (exactByName) return exactByName.name;

      const exactByAcronym = universities.find(
        (item) => item.acronym.trim().toLowerCase() === normalized,
      );
      return exactByAcronym ? exactByAcronym.name : rawInput;
    },
    [universities, universitiesByName],
  );

  const matchesInstitutionOption = useCallback(
    (option: string, input: string) => {
      const normalizedInput = input.trim().toLowerCase();
      if (!normalizedInput) return true;

      const university = universitiesByName.get(option.trim().toLowerCase());
      if (!university) {
        return option.toLowerCase().includes(normalizedInput);
      }

      const normalizedName = university.name.trim().toLowerCase();
      const normalizedAcronym = university.acronym.trim().toLowerCase();

      return (
        normalizedName.includes(normalizedInput) ||
        normalizedAcronym.includes(normalizedInput)
      );
    },
    [universitiesByName],
  );

  const handleInstitutionChange = useCallback((newInstitution: string) => {
    setInstitutionDirty(true);
    setCourseDirty(true);
    setInstitution(newInstitution);
    setCourse("");
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
    isInstitutionSelected,
    isCourseSelected,
    normalizeInstitutionInput,
    matchesInstitutionOption,
    loadingUniversities,
    loadingCourses,
    loadError,
    institution: effectiveInstitution,
    course: effectiveCourse,
    selectedUniversityId: selectedUniversity?._id ?? null,
    selectedCourseId: selectedCourse?._id ?? null,
  };
}