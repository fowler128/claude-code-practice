"use client";

import { useMemo, useState } from "react";
import { useCrm } from "@/components/crm/crm-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArticleRecord } from "@/lib/types";

const statusColors: Record<string, string> = {
  IDEA: "bg-slate-600",
  DRAFTING: "bg-amber-600",
  REVIEW: "bg-blue-600",
  PUBLISHED: "bg-emerald-600"
};

function ArticleDetail({ article, onBack }: { article: ArticleRecord; onBack: () => void }) {
  const passedCount = article.aeoGeoChecklist.filter((item) => item.passed).length;
  const totalCount = article.aeoGeoChecklist.length;
  const scorePercent = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  return (
    <section className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm text-sky-400 hover:text-sky-300">
        &larr; Back to Content
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{article.title}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {article.clientName} &middot; {article.contentType} &middot;{" "}
            <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium text-white ${statusColors[article.status]}`}>
              {article.status}
            </span>
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Target keyword: <span className="text-slate-300">{article.targetKeyword}</span>
          </p>
          {article.url && (
            <p className="mt-1 text-sm text-slate-500">
              URL: <span className="text-sky-400">{article.url}</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: GSC Metrics + Schema */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Google Search Console Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {article.status !== "PUBLISHED" ? (
                <p className="text-sm text-slate-500">Metrics available after publishing.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 text-center">
                    <p className="text-2xl font-semibold text-slate-100">{article.gsc.impressions.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">Impressions</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 text-center">
                    <p className="text-2xl font-semibold text-slate-100">{article.gsc.clicks.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">Clicks</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 text-center">
                    <p className="text-2xl font-semibold text-slate-100">{article.gsc.ctr}%</p>
                    <p className="text-xs text-slate-400">CTR</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 text-center">
                    <p className="text-2xl font-semibold text-slate-100">{article.gsc.avgPosition}</p>
                    <p className="text-xs text-slate-400">Avg Position</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schema Markup</CardTitle>
            </CardHeader>
            <CardContent>
              {article.schemaMarkup.length === 0 ? (
                <p className="text-sm text-slate-500">No schema markup defined yet.</p>
              ) : (
                <div className="space-y-3">
                  {article.schemaMarkup.map((schema) => (
                    <div key={schema.type}>
                      <p className="mb-1 text-xs font-medium text-slate-300">{schema.type}</p>
                      <pre className="overflow-x-auto rounded-md border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
                        {schema.snippet}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: AEO/GEO Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>
              AEO / GEO Optimization Checklist
              {totalCount > 0 && (
                <span
                  className={`ml-2 text-sm font-normal ${scorePercent >= 75 ? "text-emerald-400" : scorePercent >= 50 ? "text-amber-400" : "text-red-400"}`}
                >
                  {passedCount}/{totalCount} ({scorePercent}%)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalCount === 0 ? (
              <p className="text-sm text-slate-500">No checklist items for this content type.</p>
            ) : (
              <ul className="space-y-2">
                {article.aeoGeoChecklist.map((item) => (
                  <li key={item.label} className="flex items-start gap-2 text-sm">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${item.passed ? "bg-emerald-600/20 text-emerald-400" : "bg-red-600/20 text-red-400"}`}>
                      {item.passed ? "\u2713" : "\u2717"}
                    </span>
                    <span className={item.passed ? "text-slate-300" : "text-slate-400"}>{item.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default function ContentPage() {
  const { articles } = useCrm();
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  const selectedArticle = useMemo(
    () => articles.find((a) => a.id === selectedArticleId) ?? null,
    [articles, selectedArticleId]
  );

  const clientGroups = useMemo(() => {
    const groups: Record<string, { clientName: string; articles: ArticleRecord[] }> = {};
    for (const article of articles) {
      if (!groups[article.clientId]) {
        groups[article.clientId] = { clientName: article.clientName, articles: [] };
      }
      groups[article.clientId].articles.push(article);
    }
    return Object.entries(groups);
  }, [articles]);

  const totalPublished = articles.filter((a) => a.status === "PUBLISHED").length;
  const totalInPipeline = articles.filter((a) => a.status !== "PUBLISHED").length;
  const avgAeoScore = useMemo(() => {
    const scored = articles.filter((a) => a.aeoGeoChecklist.length > 0);
    if (scored.length === 0) return 0;
    const total = scored.reduce((sum, a) => {
      const passed = a.aeoGeoChecklist.filter((c) => c.passed).length;
      return sum + (passed / a.aeoGeoChecklist.length) * 100;
    }, 0);
    return Math.round(total / scored.length);
  }, [articles]);
  const totalClicks = articles.reduce((sum, a) => sum + a.gsc.clicks, 0);

  if (selectedArticle) {
    return <ArticleDetail article={selectedArticle} onBack={() => setSelectedArticleId(null)} />;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Content</h2>
      <p className="text-sm text-slate-400">SEO &amp; AEO/GEO optimized content by client. Click an article to inspect.</p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Published</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-emerald-400">{totalPublished}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>In Pipeline</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-amber-400">{totalInPipeline}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Avg AEO/GEO Score</CardTitle></CardHeader>
          <CardContent><p className={`text-2xl font-semibold ${avgAeoScore >= 75 ? "text-emerald-400" : avgAeoScore >= 50 ? "text-amber-400" : "text-red-400"}`}>{avgAeoScore}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Clicks</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-sky-400">{totalClicks.toLocaleString()}</p></CardContent>
        </Card>
      </div>

      {clientGroups.map(([clientId, group]) => (
        <Card key={clientId}>
          <CardHeader>
            <CardTitle>{group.clientName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border border-slate-800 bg-slate-900 px-3 py-2 text-left text-slate-300">Title</th>
                    <th className="border border-slate-800 bg-slate-900 px-3 py-2 text-left text-slate-300">Type</th>
                    <th className="border border-slate-800 bg-slate-900 px-3 py-2 text-left text-slate-300">Status</th>
                    <th className="border border-slate-800 bg-slate-900 px-3 py-2 text-left text-slate-300">Keyword</th>
                    <th className="border border-slate-800 bg-slate-900 px-3 py-2 text-right text-slate-300">Clicks</th>
                    <th className="border border-slate-800 bg-slate-900 px-3 py-2 text-right text-slate-300">AEO/GEO</th>
                  </tr>
                </thead>
                <tbody>
                  {group.articles.map((article) => {
                    const passed = article.aeoGeoChecklist.filter((c) => c.passed).length;
                    const total = article.aeoGeoChecklist.length;
                    const score = total > 0 ? `${Math.round((passed / total) * 100)}%` : "--";

                    return (
                      <tr
                        key={article.id}
                        className="cursor-pointer hover:bg-slate-800/50"
                        onClick={() => setSelectedArticleId(article.id)}
                      >
                        <td className="border border-slate-800 px-3 py-2 text-sky-400">{article.title}</td>
                        <td className="border border-slate-800 px-3 py-2 text-slate-300">{article.contentType}</td>
                        <td className="border border-slate-800 px-3 py-2">
                          <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium text-white ${statusColors[article.status]}`}>
                            {article.status}
                          </span>
                        </td>
                        <td className="border border-slate-800 px-3 py-2 text-slate-400">{article.targetKeyword}</td>
                        <td className="border border-slate-800 px-3 py-2 text-right text-slate-300">{article.gsc.clicks > 0 ? article.gsc.clicks : "--"}</td>
                        <td className="border border-slate-800 px-3 py-2 text-right text-slate-300">{score}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
