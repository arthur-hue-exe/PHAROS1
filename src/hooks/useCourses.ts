/**
 * useCourses — busca os cursos do Supabase e mescla com os dados estáticos.
 *
 * Estratégia:
 *  1. Começa imediatamente com os cursos estáticos de content.ts (zero latência).
 *  2. Em paralelo, busca a tabela `courses` do Supabase (leitura pública, anon key).
 *  3. Quando o BD responde, sobrescreve apenas o campo `is_available` de cada curso,
 *     mantendo todos os outros dados (descrição, preço, syllabus, etc.) do content.ts.
 *  4. Se o BD falhar (rede, tabela inexistente, etc.), mantém os dados estáticos
 *     silenciosamente — o site continua funcionando com is_available=true como fallback.
 *
 * Isso garante:
 *  - Zero flash de conteúdo vazio no carregamento inicial.
 *  - Disponibilidade real vinda do banco (sem deploy para alterar).
 *  - Resiliência total a falhas de rede.
 */

import { useState, useEffect } from 'react';
import { courses as staticCourses, type Course } from '@/data/content';
import { supabase } from '@/lib/supabase';

interface CourseAvailability {
  slug: string;
  is_available: boolean;
}

interface UseCoursesResult {
  courses: Course[];
  /** true apenas no primeiro carregamento antes do BD responder */
  loading: boolean;
}

export function useCourses(): UseCoursesResult {
  // Estado inicial: cursos estáticos (renderiza imediatamente)
  const [courses, setCourses] = useState<Course[]>(staticCourses);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAvailability() {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('slug, is_available');

        if (cancelled) return;

        if (error) {
          // Tabela pode não existir ainda (migration não executada) — não quebra o site
          if (import.meta.env.DEV) {
            console.warn(
              '[useCourses] Não foi possível buscar disponibilidade do BD.',
              error.message,
              '— usando dados estáticos (is_available=true para todos).'
            );
          }
          return;
        }

        if (!data || data.length === 0) return;

        // Mapa slug → is_available para lookup O(1)
        const availabilityMap = new Map<string, boolean>(
          (data as CourseAvailability[]).map((c) => [c.slug, c.is_available])
        );

        setCourses((prev) =>
          prev.map((course) => {
            const dbAvailable = availabilityMap.get(course.slug);
            // Se o slug não existir no BD, mantém o valor estático
            if (dbAvailable === undefined) return course;
            return { ...course, is_available: dbAvailable };
          })
        );
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[useCourses] Erro inesperado ao buscar cursos:', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAvailability();
    return () => { cancelled = true; };
  }, []);

  return { courses, loading };
}

/**
 * useCourse — versão singular: retorna um único curso por slug,
 * já com is_available atualizado do BD.
 */
export function useCourse(slug: string): { course: Course | undefined; loading: boolean } {
  const { courses, loading } = useCourses();
  return { course: courses.find((c) => c.slug === slug), loading };
}
