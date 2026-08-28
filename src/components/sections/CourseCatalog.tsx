import { useState } from 'react';
import { courses, categoryFilters } from '@/data/content';
import CourseCard from '@/components/CourseCard';

export default function CourseCatalog() {
  const [filter, setFilter] = useState<(typeof categoryFilters)[number]>('Todos');

  const filtered = filter === 'Todos'
    ? courses
    : courses.filter((c) => c.category === filter);

  return (
    <section id="cursos" className="relative border-t border-white/5 bg-graphite py-20 md:py-28">
      <div className="container-x">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="section-label justify-center">
            <span className="h-px w-8 bg-pharos-red" />
            Formações
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Nossos Cursos
          </h2>
          <p className="mt-4 text-steel">
            Cursos de Atualização, Aperfeiçoamento e Formação Profissional para o
            mercado de segurança privada em Goiás.
          </p>
        </div>

        {/* Filters */}
        <div className="reveal mt-10 flex flex-wrap items-center justify-center gap-2">
          {categoryFilters.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-5 py-2 text-sm font-medium uppercase tracking-wider transition-all duration-300 ${
                filter === cat
                  ? 'bg-pharos-red text-white'
                  : 'border border-white/15 text-steel hover:border-pharos-red/50 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="reveal-stagger mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
}
