import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryLabel, PageShell, TermEn } from "@/components/n2d/parts";
import { SaveButton } from "@/components/n2d/save-button";
import { ALL_TERMS, getTerm } from "@/lib/terms/data";

// 사전에 있는 용어만 페이지를 미리 만들고, 없는 주소는 404 로 보낸다.
export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_TERMS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/terms/[id]">): Promise<Metadata> {
  const term = getTerm((await params).id);
  if (!term) return {};
  return { title: `${term.term} (${term.term_en})`, description: term.definition };
}

export default async function TermPage({ params }: PageProps<"/terms/[id]">) {
  const term = getTerm((await params).id);
  if (!term) notFound();

  const related = term.related.map(getTerm).filter((t) => t !== undefined);

  return (
    <PageShell width="narrow">
      <Link
        href="/terms"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        용어 사전
      </Link>

      <article className="mt-4 rounded-2xl border bg-card px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-[2rem] leading-tight font-bold tracking-tight">{term.term}</h1>
          <TermEn className="text-base">{term.term_en}</TermEn>
          <SaveButton termId={term.id} termName={term.term} className="ml-auto self-center px-3 py-1.5 text-sm" />
        </div>
        <div className="mt-2">
          <CategoryLabel category={term.category} detail={term.subcategory} />
        </div>

        <p className="mt-5 text-[17px] leading-8">{term.definition}</p>

        <dl className="mt-6 grid gap-x-6 gap-y-4 border-t pt-6 text-[15px] leading-7 sm:grid-cols-[6.5rem_1fr]">
          <dt className="font-semibold text-muted-foreground">비유</dt>
          <dd>{term.analogy}</dd>
          {term.confusable && (
            <>
              <dt className="font-semibold text-muted-foreground">헷갈리지 마세요</dt>
              <dd>{term.confusable}</dd>
            </>
          )}
          <dt className="font-semibold text-muted-foreground">이렇게도 말해요</dt>
          <dd className="text-muted-foreground">{term.aliases.join(" · ")}</dd>
        </dl>

        <section className="mt-6 rounded-xl bg-secondary px-4 py-3.5">
          <h2 className="text-xs font-semibold text-muted-foreground">요청 예문</h2>
          <p className="mt-1 text-[15px] leading-7">{term.prompt_phrase}</p>
        </section>

        {term.prompt_points.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-muted-foreground">구현할 때 챙길 점</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] leading-7 marker:text-faint">
              {term.prompt_points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
        )}
      </article>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground">관련 용어</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {related.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/terms/${r.id}`}
                  className="inline-flex items-baseline gap-1.5 rounded-full border bg-card px-3.5 py-1.5 text-sm transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <span className="font-semibold">{r.term}</span>
                  <TermEn className="text-xs">{r.term_en}</TermEn>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageShell>
  );
}
